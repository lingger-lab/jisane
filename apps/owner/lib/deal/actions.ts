'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

async function getAuthUserId(): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/')
  }
  return user.id
}

async function verifyDealOwnership(dealId: string, authUserId: string) {
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, status, request_id, request:request!inner(id, client_id, client:client!inner(auth_user_id))')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return { error: '거래 정보를 찾을 수 없습니다.' }
  }

  const request = deal.request as unknown as { id: string; client_id: string; client: { auth_user_id: string } }
  if (request.client.auth_user_id !== authUserId) {
    return { error: '접근 권한이 없습니다.' }
  }

  return { deal, requestId: request.id, clientId: request.client_id }
}

export async function approveDeal(dealId: string): Promise<{ error?: string }> {
  const authUserId = await getAuthUserId()
  const result = await verifyDealOwnership(dealId, authUserId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  const { deal, requestId } = result as { deal: { id: string; status: string }; requestId: string }

  if (deal.status !== 'quoted') {
    return { error: '승인할 수 없는 상태입니다.' }
  }

  // deal.status → 'working'
  const { error } = await adminClient
    .from('deal')
    .update({ status: 'working' })
    .eq('id', dealId)

  if (error) {
    return { error: '견적 승인에 실패했습니다.' }
  }

  redirect(`/status/${requestId}?success=deal_approved`)
}

export async function confirmDeal(dealId: string): Promise<{ error?: string }> {
  const authUserId = await getAuthUserId()
  const result = await verifyDealOwnership(dealId, authUserId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  const { deal, requestId } = result as { deal: { id: string; status: string }; requestId: string }

  if (deal.status !== 'working') {
    return { error: '검수할 수 없는 상태입니다.' }
  }

  // deal.status → 'done'
  const { error: dealError } = await adminClient
    .from('deal')
    .update({ status: 'done' })
    .eq('id', dealId)

  if (dealError) {
    return { error: '검수 확인에 실패했습니다.' }
  }

  // settlement.escrow_status → 'reviewing'
  const { error: settlementErr } = await adminClient
    .from('settlement')
    .update({ escrow_status: 'reviewing' })
    .eq('deal_id', dealId)

  if (settlementErr) {
    console.error('[confirmDeal] settlement update failed:', settlementErr.message)
  }

  redirect(`/status/${requestId}?success=deal_confirmed`)
}

export async function requestRevision(dealId: string, reason: string): Promise<{ error?: string }> {
  const authUserId = await getAuthUserId()
  const result = await verifyDealOwnership(dealId, authUserId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  const { deal, clientId } = result as { deal: { id: string; status: string }; requestId: string; clientId: string }

  if (deal.status !== 'working') {
    return { error: '수정 요청할 수 없는 상태입니다.' }
  }

  // deliver 단계에 수정 요청 note 추가
  await adminClient
    .from('deal_workflow')
    .update({ note: `수정 요청: ${reason}`, status: 'in_progress' })
    .eq('deal_id', dealId)
    .eq('step', 'deliver')

  // 파트너에게 수정 요청 알림 (deal_message)
  await adminClient
    .from('deal_message')
    .insert({
      deal_id: dealId,
      sender_type: 'client',
      sender_id: clientId,
      content: `[수정 요청] ${reason}`,
    })

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

  // 이미 리뷰가 있는지 확인
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
