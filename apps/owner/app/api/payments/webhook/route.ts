import { NextResponse } from 'next/server'
import { confirmAndRecordDeposit } from '@/lib/payments/confirm-deposit'
import { parseOrderId } from '@jisane/shared/payment'
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

  // orderId 해석은 공유 파서로 — 생성 측과 형식이 어긋나지 않도록 한 곳에서만 정의한다.
  const parsed = parseOrderId(orderId)
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid orderId format' }, { status: 400 })
  }

  // kind 분기(§3.2·§11.4): 구독 청구 웹훅을 deal 경로로 보내면 subId가 dealId로 조회돼
  // 404→non-2xx→Toss 무한 재전송이 된다(파서가 막은 오파싱이 라우팅 층에서 재발). 구독 빌링은
  // 아직 미구현(결제계약 게이트)이므로 수신만 확인(200)하고 처리는 빌링 단계에서 추가한다.
  if (parsed.kind !== 'deal') {
    console.warn(
      `[payments/webhook] 미처리 kind=${parsed.kind} orderId=${orderId} — 빌링 단계에서 처리 예정`,
    )
    return NextResponse.json({ success: true, message: `Acknowledged ${parsed.kind} webhook` })
  }
  const dealId = parsed.id

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
