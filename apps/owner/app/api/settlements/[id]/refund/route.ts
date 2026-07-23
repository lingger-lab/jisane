import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { cancelPayment } from '@jisane/shared/payment'
import crypto from 'crypto'

/**
 * 관리자 전용: 환불 처리
 * POST /api/settlements/[id]/refund
 * Header: x-admin-secret
 * Body: { amount, reason }
 */
export async function POST(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: settlementId } = await props.params

  // 관리자 인증 (타이밍세이프 비교)
  const adminSecret = request.headers.get('x-admin-secret')
  const expectedSecret = process.env.ADMIN_SECRET
  if (!expectedSecret) {
    return NextResponse.json({ error: 'ADMIN_SECRET not configured' }, { status: 500 })
  }
  const givenBuf = Buffer.from(adminSecret || '')
  const expectedBuf = Buffer.from(expectedSecret)
  if (
    givenBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(givenBuf, expectedBuf)
  ) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { amount, reason } = body

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: 'Invalid refund amount' }, { status: 400 })
  }

  if (!reason) {
    return NextResponse.json({ error: 'Refund reason is required' }, { status: 400 })
  }

  // settlement 조회
  const { data: settlement } = await adminClient
    .from('settlement')
    .select('id, deal_id, escrow_status, payment_key, refunded_amt, guarantee_fee, total_pay')
    .eq('id', settlementId)
    .single()

  if (!settlement) {
    return NextResponse.json({ error: 'Settlement not found' }, { status: 404 })
  }

  if (settlement.escrow_status !== 'deposited' && settlement.escrow_status !== 'reviewing') {
    return NextResponse.json(
      { error: `Cannot refund: current status is ${settlement.escrow_status}` },
      { status: 400 }
    )
  }

  // 환불 초과 검증
  const newRefundedAmt = (settlement.refunded_amt || 0) + amount
  if (newRefundedAmt > settlement.total_pay) {
    return NextResponse.json(
      { error: `환불 금액 초과: 총 결제액 ${settlement.total_pay}원, 누적 환불 요청 ${newRefundedAmt}원` },
      { status: 400 }
    )
  }

  // Toss 결제 취소 (payment_key가 있는 경우)
  // 멱등키: 같은 settlement의 같은 누적환불액 요청이 재시도되어도 이중 취소되지 않음
  if (settlement.payment_key) {
    const idempotencyKey = `refund_${settlementId}_${newRefundedAmt}`
    const cancelResult = await cancelPayment(settlement.payment_key, reason, amount, idempotencyKey)
    if (!cancelResult.success) {
      return NextResponse.json(
        { error: `Payment cancel failed: ${cancelResult.error}` },
        { status: 500 }
      )
    }
  }
  const { error: updateError } = await adminClient
    .from('settlement')
    .update({
      escrow_status: 'refunded',
      refunded_amt: newRefundedAmt,
      refund_reason: reason,
      refunded_at: new Date().toISOString(),
    })
    .eq('id', settlementId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // 신규자 보증 여부 확인
  const { data: dealInfo } = await adminClient
    .from('deal')
    .select('expert_id, expert:expert!inner(is_newbie)')
    .eq('id', settlement.deal_id)
    .single()

  const expertInfo = dealInfo?.expert as { is_newbie: boolean | null } | null | undefined
  const isNewbieGuarantee = expertInfo?.is_newbie === true

  // guarantee_fund_ledger에 적립금 사용 기록
  if (settlement.guarantee_fee > 0) {
    const { error: ledgerErr } = await adminClient
      .from('guarantee_fund_ledger')
      .insert({
        settlement_id: settlementId,
        entry_type: isNewbieGuarantee ? 'newbie_guarantee' : 'payout',
        amount: Math.min(settlement.guarantee_fee, amount),
        note: isNewbieGuarantee
          ? `신규자 보증 환불 — ${reason}`
          : `환불 처리 — ${reason}`,
      })

    if (ledgerErr) {
      // 환불 자체는 완료됨 — 원장 드리프트만 경고로 노출
      console.error(`[refund] ledger insert failed for settlement ${settlementId}:`, ledgerErr.message)
      return NextResponse.json({
        success: true,
        refunded_amt: newRefundedAmt,
        warning: `환불은 완료됐으나 적립금 원장 기록에 실패했습니다: ${ledgerErr.message}`,
      })
    }
  }

  return NextResponse.json({ success: true, refunded_amt: newRefundedAmt })
}
