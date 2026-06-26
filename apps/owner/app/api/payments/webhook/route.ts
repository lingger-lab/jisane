import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { confirmPayment } from '@jisane/shared/payment'
import crypto from 'crypto'

/**
 * Toss Payments webhook 수신
 * 결제 완료 시 Toss에서 호출
 */
export async function POST(request: Request) {
  const body = await request.text()

  // HMAC-SHA256 서명 검증
  const signature = request.headers.get('toss-signature')
  const webhookSecret = process.env.TOSS_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('base64')
  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { paymentKey, orderId, status: paymentStatus } = payload as {
    paymentKey: string
    orderId: string
    status: string
  }

  if (!paymentKey || !orderId) {
    return NextResponse.json({ error: 'Missing paymentKey or orderId' }, { status: 400 })
  }

  // DONE (결제 완료) 이벤트만 처리
  if (paymentStatus !== 'DONE') {
    return NextResponse.json({ success: true, message: 'Ignored non-DONE status' })
  }

  // orderId에서 dealId 추출: jisane_{dealId}_{timestamp}
  const parts = orderId.split('_')
  if (parts.length < 3 || parts[0] !== 'jisane') {
    return NextResponse.json({ error: 'Invalid orderId format' }, { status: 400 })
  }
  const dealId = parts[1]

  // deal 조회
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, total_pay, status')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  // Toss 결제 승인
  const confirmResult = await confirmPayment(paymentKey, orderId, deal.total_pay)
  if (!confirmResult.success) {
    return NextResponse.json({ error: confirmResult.error }, { status: 500 })
  }

  // settlement 업데이트
  await adminClient
    .from('settlement')
    .update({
      escrow_status: 'deposited',
      payment_key: paymentKey,
      deposited_at: new Date().toISOString(),
    })
    .eq('deal_id', dealId)

  // deal.status → 'working' (quoted인 경우에만)
  if (deal.status === 'quoted') {
    await adminClient
      .from('deal')
      .update({ status: 'working' })
      .eq('id', dealId)
  }

  return NextResponse.json({ success: true })
}
