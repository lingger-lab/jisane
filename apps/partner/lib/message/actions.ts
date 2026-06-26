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

export async function sendDealMessage(
  dealId: string,
  content: string
): Promise<{ error?: string }> {
  const partnerId = await getPartnerId()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }
  if (content.length > 1000) return { error: '메시지는 1000자 이내로 입력해주세요.' }

  // deal 소유권 확인
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, partner_id')
    .eq('id', dealId)
    .single()

  if (!deal || deal.partner_id !== partnerId) {
    return { error: '접근 권한이 없습니다.' }
  }

  const { error } = await adminClient
    .from('deal_message')
    .insert({
      deal_id: dealId,
      sender_type: 'partner',
      sender_id: partnerId,
      content: content.trim(),
    })

  if (error) return { error: error.message }

  revalidatePath(`/work/${dealId}`)
  return {}
}

export async function sendMatchingInquiry(
  matchingId: string,
  content: string
): Promise<{ error?: string }> {
  const partnerId = await getPartnerId()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }

  // matching 소유권 확인
  const { data: matching } = await adminClient
    .from('matching')
    .select('id, partner_id, request_id')
    .eq('id', matchingId)
    .single()

  if (!matching || matching.partner_id !== partnerId) {
    return { error: '접근 권한이 없습니다.' }
  }

  // inquiry 테이블에 저장 (기존 문의 시스템 활용)
  const { error } = await adminClient
    .from('inquiry')
    .insert({
      author_id: partnerId,
      author_type: 'partner',
      category: `matching:${matchingId}`,
      content: content.trim(),
      status: 'open',
    })

  if (error) return { error: error.message }

  revalidatePath(`/matching/${matchingId}`)
  return {}
}
