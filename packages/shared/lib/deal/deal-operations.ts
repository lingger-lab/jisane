import { adminClient } from '../supabase/admin'
import { getAuthUserId, verifyDealOwnership } from '../auth/server-helpers'

/**
 * 견적 승인 — deal.status: quoted → working
 * redirect는 호출 측에서 처리합니다.
 */
export async function approveDealOp(dealId: string): Promise<{ error?: string; requestId?: string }> {
  const authUserId = await getAuthUserId()
  const result = await verifyDealOwnership(dealId, authUserId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  const { deal, requestId } = result as { deal: { id: string; status: string }; requestId: string }

  if (deal.status !== 'quoted') {
    return { error: '승인할 수 없는 상태입니다.' }
  }

  const { error } = await adminClient
    .from('deal')
    .update({ status: 'working' })
    .eq('id', dealId)

  if (error) {
    return { error: '견적 승인에 실패했습니다.' }
  }

  return { requestId }
}

/**
 * 검수 확인 — deal.status: working → done, settlement.escrow_status → reviewing
 * redirect는 호출 측에서 처리합니다.
 */
export async function confirmDealOp(dealId: string): Promise<{ error?: string; requestId?: string }> {
  const authUserId = await getAuthUserId()
  const result = await verifyDealOwnership(dealId, authUserId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  const { deal, requestId } = result as { deal: { id: string; status: string }; requestId: string }

  if (deal.status !== 'working') {
    return { error: '검수할 수 없는 상태입니다.' }
  }

  const { error: dealError } = await adminClient
    .from('deal')
    .update({ status: 'done' })
    .eq('id', dealId)

  if (dealError) {
    return { error: '검수 확인에 실패했습니다.' }
  }

  const { error: settlementErr } = await adminClient
    .from('settlement')
    .update({ escrow_status: 'reviewing' })
    .eq('deal_id', dealId)

  if (settlementErr) {
    console.error('[confirmDeal] settlement update failed:', settlementErr.message)
  }

  return { requestId }
}

/**
 * 수정 요청 — deal_workflow deliver 단계에 수정 note 추가
 * owner 앱에서는 추가로 deal_message를 삽입합니다 (clientId 필요).
 */
export async function requestRevisionOp(
  dealId: string,
  reason: string
): Promise<{ error?: string; clientId?: string }> {
  const authUserId = await getAuthUserId()
  const result = await verifyDealOwnership(dealId, authUserId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  const { deal, clientId } = result as { deal: { id: string; status: string }; clientId: string }

  if (deal.status !== 'working') {
    return { error: '수정 요청할 수 없는 상태입니다.' }
  }

  await adminClient
    .from('deal_workflow')
    .update({ note: `수정 요청: ${reason}`, status: 'in_progress' })
    .eq('deal_id', dealId)
    .eq('step', 'deliver')

  return { clientId }
}
