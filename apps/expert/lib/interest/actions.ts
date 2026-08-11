'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { resolveExpertFromAuth } from '@jisane/shared/auth/server-helpers'

async function getExpertId(): Promise<string> {
  const { user, expert } = await resolveExpertFromAuth()

  if (!user || !expert) redirect('/')

  return expert.id
}

export async function expressInterest(
  requestId: string,
  note?: string
): Promise<{ error?: string }> {
  const expertId = await getExpertId()

  // 동시 활성 관심표현 제한 (platform_config.max_active_interests, 기본 5)
  const { data: config } = await adminClient
    .from('platform_config')
    .select('value')
    .eq('key', 'max_active_interests')
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
    console.error('[expressInterest] insert failed:', error.message)
    return { error: '관심 표현에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath('/matching')
  revalidatePath('/requests')
  // OpportunitySection은 홈('/')의 expert-dashboard에 마운트된다 — 이 경로를
  // 갱신하지 않으면 재방문 시 캐시된 옛 관심 상태가 렌더된다 (감사 P3-43)
  revalidatePath('/')
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

  if (error) {
    console.error('[withdrawInterest] delete failed:', error.message)
    return { error: '관심 표현 철회에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath('/matching')
  revalidatePath('/requests')
  // OpportunitySection은 홈('/')의 expert-dashboard에 마운트된다 — 이 경로를
  // 갱신하지 않으면 재방문 시 캐시된 옛 관심 상태가 렌더된다 (감사 P3-43)
  revalidatePath('/')
  return {}
}
