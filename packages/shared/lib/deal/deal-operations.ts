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

  // CAS: SELECT 이후 상태가 바뀐 경쟁 전이(취소·중복 제출)를 덮어쓰지 않도록
  // quoted일 때만 갱신하고, 0행이면 실패로 처리한다(감사 docs/11 P2-58)
  const { data: updated, error } = await adminClient
    .from('deal')
    .update({ status: 'working' })
    .eq('id', dealId)
    .eq('status', 'quoted')
    .select('id')

  if (error) {
    return { error: '견적 승인에 실패했습니다.' }
  }
  if (!updated || updated.length === 0) {
    return { error: '승인할 수 없는 상태입니다.' }
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

  // 입금 확인(deposited) 전 검수 완료 차단 — 미입금 정산이 reviewing으로 넘어가
  // 3일 후 자동정산(released)까지 진행되는 것을 구조적으로 막는다
  const { data: settlement } = await adminClient
    .from('settlement')
    .select('escrow_status')
    .eq('deal_id', dealId)
    .single()

  if (!settlement || settlement.escrow_status !== 'deposited') {
    return { error: '입금 확인 전에는 검수를 완료할 수 없습니다. 입금이 확인되면 다시 시도해주세요.' }
  }

  // CAS: working일 때만 done으로 — 경쟁 전이(취소·분쟁)를 lost-update로 덮지 않는다(P2-58)
  const { data: dealUpdated, error: dealError } = await adminClient
    .from('deal')
    .update({ status: 'done' })
    .eq('id', dealId)
    .eq('status', 'working')
    .select('id')

  if (dealError) {
    return { error: '검수 확인에 실패했습니다.' }
  }
  if (!dealUpdated || dealUpdated.length === 0) {
    return { error: '검수할 수 없는 상태입니다.' }
  }

  const { error: settlementErr } = await adminClient
    .from('settlement')
    .update({ escrow_status: 'reviewing' })
    .eq('deal_id', dealId)

  if (settlementErr) {
    console.error('[confirmDeal] settlement update failed:', settlementErr.message)
    // 보상: deal을 working으로 되돌려 deal/settlement 상태 괴리를 방지(done일 때만 되돌림).
    // 이 보상마저 실패하면 deal=done·settlement=deposited로 괴리가 남으므로 반드시
    // critical 로그로 가시화한다(감사 docs/11 P3-98). 원자성(단일 트랜잭션)은 RPC 이관 필요(P1-17 계열).
    const { error: compErr } = await adminClient
      .from('deal')
      .update({ status: 'working' })
      .eq('id', dealId)
      .eq('status', 'done')
    if (compErr) {
      console.error(
        `[confirmDeal] CRITICAL: 보상 롤백 실패 — deal ${dealId}가 done인데 settlement는 reviewing 전환 실패. 수동 정합 필요:`,
        compErr.message
      )
    }
    return { error: '검수 확인에 실패했습니다. 다시 시도해주세요.' }
  }

  return { requestId }
}

/**
 * 수정 요청 — deal_workflow deliver 단계에 수정 note 추가
 * owner 앱에서는 추가로 deal_message를 삽입합니다 (ownerId 필요).
 */
export async function requestRevisionOp(
  dealId: string,
  reason: string
): Promise<{ error?: string; ownerId?: string }> {
  const authUserId = await getAuthUserId()
  const result = await verifyDealOwnership(dealId, authUserId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  const { deal, ownerId } = result as { deal: { id: string; status: string }; ownerId: string }

  if (deal.status !== 'working') {
    return { error: '수정 요청할 수 없는 상태입니다.' }
  }

  await adminClient
    .from('deal_workflow')
    .update({ note: `수정 요청: ${reason}`, status: 'in_progress' })
    .eq('deal_id', dealId)
    .eq('step', 'deliver')

  return { ownerId }
}
