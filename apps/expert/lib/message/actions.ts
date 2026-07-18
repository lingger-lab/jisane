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

export async function sendDealMessage(
  dealId: string,
  content: string
): Promise<{ error?: string }> {
  const expertId = await getExpertId()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }
  if (content.length > 1000) return { error: '메시지는 1000자 이내로 입력해주세요.' }

  // deal 소유권 확인
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, expert_id')
    .eq('id', dealId)
    .single()

  if (!deal || deal.expert_id !== expertId) {
    return { error: '접근 권한이 없습니다.' }
  }

  const { error } = await adminClient
    .from('deal_message')
    .insert({
      deal_id: dealId,
      sender_type: 'expert',
      sender_id: expertId,
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
  const expertId = await getExpertId()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }

  // matching 소유권 확인
  const { data: matching } = await adminClient
    .from('matching')
    .select('id, expert_id, request_id')
    .eq('id', matchingId)
    .single()

  if (!matching || matching.expert_id !== expertId) {
    return { error: '접근 권한이 없습니다.' }
  }

  // inquiry 테이블에 저장 (기존 문의 시스템 활용)
  const { error } = await adminClient
    .from('inquiry')
    .insert({
      author_id: expertId,
      author_type: 'expert',
      category: `matching:${matchingId}`,
      content: content.trim(),
      status: 'open',
    })

  if (error) return { error: error.message }

  revalidatePath(`/matching/${matchingId}`)
  return {}
}
