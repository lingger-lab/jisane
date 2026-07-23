import { adminClient } from '@jisane/shared/supabase/admin'
import { confirmPayment } from '@jisane/shared/payment'

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
    return { ok: true, requestId: deal.request_id, alreadyProcessed: true }
  }

  // 금액은 서버측 산출값(deal.total_pay)만 사용 — 위변조 불가
  const confirmResult = await confirmPayment(paymentKey, orderId, deal.total_pay)
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
    const { error: dealErr } = await adminClient
      .from('deal')
      .update({ status: 'working' })
      .eq('id', dealId)

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
