'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

async function getPartnerId(): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) redirect('/')

  return partner.id
}

export async function expressInterest(
  requestId: string,
  note?: string
): Promise<{ error?: string }> {
  const partnerId = await getPartnerId()

  // 의뢰가 open 상태인지 확인
  const { data: request } = await adminClient
    .from('request')
    .select('id, status')
    .eq('id', requestId)
    .single()

  if (!request) return { error: '의뢰를 찾을 수 없습니다.' }
  if (request.status !== 'open') return { error: '이미 매칭이 진행 중인 의뢰입니다.' }

  const { error } = await adminClient
    .from('partner_interest')
    .insert({
      request_id: requestId,
      partner_id: partnerId,
      note: note || null,
    })

  if (error) {
    if (error.code === '23505') {
      return { error: '이미 관심을 표현한 의뢰입니다.' }
    }
    return { error: error.message }
  }

  revalidatePath('/matching')
  return {}
}

export async function withdrawInterest(
  requestId: string
): Promise<{ error?: string }> {
  const partnerId = await getPartnerId()

  const { error } = await adminClient
    .from('partner_interest')
    .delete()
    .eq('request_id', requestId)
    .eq('partner_id', partnerId)

  if (error) return { error: error.message }

  revalidatePath('/matching')
  return {}
}
