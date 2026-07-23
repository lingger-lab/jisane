import { NextResponse } from 'next/server'
import { confirmAndRecordDeposit } from '@/lib/payments/confirm-deposit'
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
  const signatureBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (
    signatureBuf.length !== expectedBuf.length ||
    !crypto.timingSafeEqual(signatureBuf, expectedBuf)
  ) {
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

  const result = await confirmAndRecordDeposit(dealId, paymentKey, orderId)

  if (!result.ok) {
    // 캡처 이후 DB 기록 실패 포함 — non-2xx를 반환해 Toss 재전송을 유도
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json({
    success: true,
    ...(result.alreadyProcessed ? { message: 'Already processed' } : {}),
  })
}
