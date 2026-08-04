'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getAuthUserId, verifyDealOwnership } from '@jisane/shared/auth/server-helpers'
import { approveDealOp, confirmDealOp, requestRevisionOp } from '@jisane/shared/deal/deal-operations'
import { recalcExpertScores } from '@jisane/shared/expert-scoring'

export async function approveDeal(dealId: string): Promise<{ error?: string }> {
  const result = await approveDealOp(dealId)
  if (result.error) return { error: result.error }
  redirect(`/status/${result.requestId}?success=deal_approved`)
}

export async function confirmDeal(dealId: string): Promise<{ error?: string }> {
  const result = await confirmDealOp(dealId)
  if (result.error) return { error: result.error }
  redirect(`/status/${result.requestId}?success=deal_confirmed`)
}

export async function requestRevision(dealId: string, reason: string): Promise<{ error?: string }> {
  const result = await requestRevisionOp(dealId, reason)
  if (result.error) return { error: result.error }

  // owner-specific: 시니어지식인에게 수정 요청 알림 (deal_message)
  if (result.ownerId) {
    await adminClient
      .from('deal_message')
      .insert({
        deal_id: dealId,
        sender_type: 'owner',
        sender_id: result.ownerId,
        content: `[수정 요청] ${reason}`,
      })
  }

  return {}
}

export async function submitReview(
  dealId: string,
  rating: number,
  comment: string
): Promise<{ error?: string }> {
  const authUserId = await getAuthUserId()
  const result = await verifyDealOwnership(dealId, authUserId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  const { deal, requestId } = result as { deal: { id: string; status: string }; requestId: string; ownerId: string }

  if (deal.status !== 'done') {
    return { error: '리뷰를 작성할 수 없는 상태입니다.' }
  }

  if (rating < 1 || rating > 5) {
    return { error: '별점은 1~5 사이로 입력해주세요.' }
  }

  const { data: existing } = await adminClient
    .from('review')
    .select('id')
    .eq('deal_id', dealId)
    .eq('author_type', 'owner')
    .single()

  if (existing) {
    return { error: '이미 리뷰를 작성하셨습니다.' }
  }

  const { error } = await adminClient
    .from('review')
    .insert({
      deal_id: dealId,
      author_type: 'owner',
      rating,
      comment: comment.trim() || null,
    })

  if (error) return { error: error.message }

  // 리뷰 점수를 시니어지식인 스코어에 즉시 반영 — release 시점 재계산에만 의존하면
  // release 후 작성된 리뷰가 다음 관리자 이벤트까지 미반영으로 남는다
  const { data: dealRow } = await adminClient
    .from('deal')
    .select('expert_id')
    .eq('id', dealId)
    .single()
  if (dealRow?.expert_id) {
    await recalcExpertScores(adminClient, dealRow.expert_id)
  }

  revalidatePath(`/status/${requestId}`)
  return {}
}
