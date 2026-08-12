import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { confirmAndRecordDeposit } from '@/lib/payments/confirm-deposit'
import { parseOrderId } from '@jisane/shared/payment'

/**
 * Toss 결제 성공 리다이렉트 종단
 * GET /api/payments/success?dealId=...&paymentKey=...&orderId=...&amount=...
 * 결제 승인 후 의뢰 상태 페이지로 리다이렉트한다. (웹훅과 경합해도 멱등)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const dealId = searchParams.get('dealId')
  const paymentKey = searchParams.get('paymentKey')
  const orderId = searchParams.get('orderId')

  if (!dealId || !paymentKey || !orderId) {
    return NextResponse.redirect(new URL('/?error=payment_invalid', request.url))
  }

  // orderId 해석은 공유 파서로 (생성 측과 단일 계약). 쿼리 dealId와도 일치해야 한다.
  const parsed = parseOrderId(orderId)
  if (!parsed || parsed.id !== dealId) {
    return NextResponse.redirect(new URL('/?error=payment_invalid', request.url))
  }

  const result = await confirmAndRecordDeposit(dealId, paymentKey, orderId)

  if (!result.ok) {
    console.error('[payments/success] confirm failed:', result.error)
    const target = result.requestId ? `/status/${result.requestId}?error=payment` : '/?error=payment'
    return NextResponse.redirect(new URL(target, request.url))
  }

  const target = result.requestId
    ? `/status/${result.requestId}?success=payment`
    : '/?success=payment'
  return NextResponse.redirect(new URL(target, request.url))
}
