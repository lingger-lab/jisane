'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

async function getExpertId(): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: expert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert) redirect('/')

  return expert.id
}

export async function expressInterest(
  requestId: string,
  note?: string
): Promise<{ error?: string }> {
  const expertId = await getExpertId()

  // 동시 활성 관심표현 제한 (platform_config.max_interests, 기본 5)
  const { data: config } = await adminClient
    .from('platform_config')
    .select('value')
    .eq('key', 'max_interests')
    .single()

  const maxInterests = config?.value ? Number(config.value) : 5

  const { count: activeCount } = await adminClient
    .from('expert_interest')
    .select('id', { count: 'exact', head: true })
    .eq('expert_id', expertId)

  if ((activeCount ?? 0) >= maxInterests) {
    return { error: `동시에 ${maxInterests}개까지만 관심 표현할 수 있습니다.` }
  }

  // 의뢰가 open 상태인지 확인
  const { data: request } = await adminClient
    .from('request')
    .select('id, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: '의뢰를 찾을 수 없습니다.' }
  if (request.status !== 'open') return { error: '이미 매칭이 진행 중인 의뢰입니다.' }

  const { error } = await adminClient
    .from('expert_interest')
    .insert({
      request_id: requestId,
      expert_id: expertId,
      note: note || null,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: '이미 관심을 표현한 의뢰입니다.' }
    }
    return { error: error.message }
  }

  revalidatePath('/matching')
  revalidatePath('/requests')
  return {}
}

export async function withdrawInterest(
  requestId: string
): Promise<{ error?: string }> {
  const expertId = await getExpertId()

  const { error } = await adminClient
    .from('expert_interest')
    .delete()
    .eq('request_id', requestId)
    .eq('expert_id', expertId)

  if (error) return { error: error.message }

  revalidatePath('/matching')
  revalidatePath('/requests')
  return {}
}
