import { adminClient } from '@jisane/shared/supabase/admin'
import { confirmPayment } from '@jisane/shared/payment'
import { calcPayableAmount } from '@jisane/shared/pricing'

export type ConfirmDepositResult =
  | { ok: true; requestId: string | null; alreadyProcessed: boolean }
  | { ok: false; status: number; error: string; requestId?: string | null }

/**
 * Toss 결제 승인 + 에스크로 입금 기록.
 * 웹훅과 success 리다이렉트 양쪽에서 호출되므로 멱등해야 한다:
 * - settlement가 이미 pending이 아니면(입금 이후 상태) 성공으로 단락
 * - Toss가 이미 승인된 결제라고 응답하면 캡처 완료로 간주하고 DB 기록을 계속 진행
 * - 캡처 이후의 DB 기록 실패는 ok:false로 반환해 호출자가 non-2xx로 응답(웹훅 재전송 유도)
 */
export async function confirmAndRecordDeposit(
  dealId: string,
  paymentKey: string,
  orderId: string
): Promise<ConfirmDepositResult> {
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, request_id, total_pay, status')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return { ok: false, status: 404, error: 'Deal not found' }
  }

  const { data: settlement } = await adminClient
    .from('settlement')
    .select('id, escrow_status')
    .eq('deal_id', dealId)
    .single()

  if (!settlement) {
    return { ok: false, status: 404, error: 'Settlement not found', requestId: deal.request_id }
  }

  // 멱등 가드: 이미 입금 처리된 건 (웹훅 중복 전송 / 웹훅·리다이렉트 경합)
  if (settlement.escrow_status !== 'pending') {
    // 직전 시도가 settlement는 deposited로 기록했으나 deal.status 갱신 전에 실패했을 수 있다.
    // 그 경우 재진입이 여기서 단락되면 deal이 영원히 quoted로 남으므로(발주자는 결제했는데
    // 에스크로만 deposited) 여기서 마저 보정한다 (감사 docs/11 P1-13).
    if (deal.status === 'quoted') {
      const { error: dealErr } = await adminClient
        .from('deal')
        .update({ status: 'working' })
        .eq('id', dealId)
        .eq('status', 'quoted')
      if (dealErr) {
        return {
          ok: false,
          status: 500,
          error: `Deal status reconcile failed: ${dealErr.message}`,
          requestId: deal.request_id,
        }
      }
    }
    return { ok: true, requestId: deal.request_id, alreadyProcessed: true }
  }

  // 금액은 서버측 산출값만 사용 — 위변조 불가.
  // 승인 금액은 체크아웃 생성 금액(공급가+부가세)과 반드시 같아야 하므로 같은 함수에서 파생시킨다.
  const confirmResult = await confirmPayment(paymentKey, orderId, calcPayableAmount(deal.total_pay))
  if (!confirmResult.success && confirmResult.code !== 'ALREADY_PROCESSED_PAYMENT') {
    return {
      ok: false,
      status: 502,
      error: confirmResult.error || 'Toss confirm failed',
      requestId: deal.request_id,
    }
  }

  const { error: settlementErr } = await adminClient
    .from('settlement')
    .update({
      escrow_status: 'deposited',
      payment_key: paymentKey,
      deposited_at: new Date().toISOString(),
    })
    .eq('id', settlement.id)
    .eq('escrow_status', 'pending')

  if (settlementErr) {
    return {
      ok: false,
      status: 500,
      error: `Settlement update failed after capture: ${settlementErr.message}`,
      requestId: deal.request_id,
    }
  }

  if (deal.status === 'quoted') {
    // compare-and-set: 15초 Toss 승인 창 사이 deal.status가 바뀔 수 있으므로 quoted일 때만
    // 전이(lost update 방지, 감사 docs/11 P2-50).
    const { error: dealErr } = await adminClient
      .from('deal')
      .update({ status: 'working' })
      .eq('id', dealId)
      .eq('status', 'quoted')

    if (dealErr) {
      return {
        ok: false,
        status: 500,
        error: `Deal status update failed after capture: ${dealErr.message}`,
        requestId: deal.request_id,
      }
    }
  }

  return { ok: true, requestId: deal.request_id, alreadyProcessed: false }
}
