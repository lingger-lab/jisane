import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { cancelPayment } from '@/lib/payment'

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

  // 관리자 인증
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
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
  if (settlement.payment_key) {
    const cancelResult = await cancelPayment(settlement.payment_key, reason, amount)
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

  // guarantee_fund_ledger에 적립금 사용 기록 (payout)
  if (settlement.guarantee_fee > 0) {
    await adminClient
      .from('guarantee_fund_ledger')
      .insert({
        settlement_id: settlementId,
        entry_type: 'payout',
        amount: Math.min(settlement.guarantee_fee, amount),
        note: `환불 처리 — ${reason}`,
      })
  }

  return NextResponse.json({ success: true, refunded_amt: newRefundedAmt })
}
