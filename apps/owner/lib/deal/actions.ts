'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { getAuthUserId, verifyDealOwnership } from '@jisane/shared/auth/server-helpers'
import { approveDealOp, confirmDealOp, requestRevisionOp } from '@jisane/shared/deal/deal-operations'

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

  // owner-specific: 파트너에게 수정 요청 알림 (deal_message)
  if (result.clientId) {
    await adminClient
      .from('deal_message')
      .insert({
        deal_id: dealId,
        sender_type: 'client',
        sender_id: result.clientId,
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

  const { deal, requestId } = result as { deal: { id: string; status: string }; requestId: string; clientId: string }

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
    .eq('author_type', 'client')
    .single()

  if (existing) {
    return { error: '이미 리뷰를 작성하셨습니다.' }
  }

  const { error } = await adminClient
    .from('review')
    .insert({
      deal_id: dealId,
      author_type: 'client',
      rating,
      comment: comment.trim() || null,
    })

  if (error) return { error: error.message }

  revalidatePath(`/status/${requestId}`)
  return {}
}
