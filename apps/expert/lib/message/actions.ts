'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { flagIfRisky } from '@jisane/shared/audit/message-audit'
import { resolveExpertFromAuth } from '@jisane/shared/auth/server-helpers'

async function getExpertId(): Promise<string> {
  const { user, expert } = await resolveExpertFromAuth()

  if (!user || !expert) redirect('/')

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

  const trimmed = content.trim()
  const { data: msg, error } = await adminClient
    .from('deal_message')
    .insert({ deal_id: dealId, sender_type: 'expert', sender_id: expertId, content: trimmed })
    .select('id')
    .single()

  if (error) {
    console.error('[sendDealMessage] insert failed:', error.message)
    return { error: '메시지 전송에 실패했습니다. 다시 시도해주세요.' }
  }
  if (msg?.id) await flagIfRisky('deal', msg.id as string, trimmed)

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

  if (error) {
    console.error('[sendMatchingInquiry] insert failed:', error.message)
    return { error: '문의 전송에 실패했습니다. 다시 시도해주세요.' }
  }

  revalidatePath(`/matching/${matchingId}`)
  return {}
}
