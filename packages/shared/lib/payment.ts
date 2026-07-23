/**
 * Toss Payments REST API 유틸 (마스터문서 v3.3 §5.3)
 * https://docs.tosspayments.com/reference
 */

const TOSS_BASE_URL = 'https://api.tosspayments.com/v1'
const TOSS_TIMEOUT_MS = 15_000

function getAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) throw new Error('TOSS_SECRET_KEY is not configured')
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${encoded}`
}

export interface CheckoutResult {
  paymentKey: string
  checkoutUrl: string
}

/**
 * Toss 결제 세션(결제 요청) 생성
 * 서버에서 orderId를 생성하고, 클라이언트에서 Toss 위젯으로 결제 진행
 */
export async function createCheckoutSession(
  dealId: string,
  amount: number,
  orderName: string
): Promise<CheckoutResult> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  if (!siteUrl) throw new Error('NEXT_PUBLIC_SITE_URL is not configured')

  const orderId = `jisane_${dealId}_${Date.now()}`

  const res = await fetch(`${TOSS_BASE_URL}/payments`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      orderId,
      orderName,
      method: '카드',
      successUrl: `${siteUrl}/api/payments/success?dealId=${dealId}`,
      failUrl: `${siteUrl}/api/payments/fail?dealId=${dealId}`,
    }),
    signal: AbortSignal.timeout(TOSS_TIMEOUT_MS),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Toss API error: ${res.status}`)
  }

  const data = await res.json()
  return {
    paymentKey: data.paymentKey,
    checkoutUrl: data.checkout?.url || '',
  }
}

/**
 * 결제 승인 (Toss에서 redirect 후 서버에서 호출)
 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string; code?: string }> {
  const res = await fetch(`${TOSS_BASE_URL}/payments/confirm`, {
    method: 'POST',
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
    signal: AbortSignal.timeout(TOSS_TIMEOUT_MS),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    return {
      success: false,
      error: data.message || `Toss confirm error: ${res.status}`,
      code: data.code,
    }
  }

  return { success: true, data }
}

/**
 * 결제 취소 (환불 시 사용)
 */
export async function cancelPayment(
  paymentKey: string,
  cancelReason: string,
  cancelAmount?: number,
  idempotencyKey?: string
): Promise<{ success: boolean; error?: string }> {
  const body: Record<string, unknown> = { cancelReason }
  if (cancelAmount !== undefined) {
    body.cancelAmount = cancelAmount
  }

  const headers: Record<string, string> = {
    Authorization: getAuthHeader(),
    'Content-Type': 'application/json',
  }
  // 재시도 시 이중 취소(이중 환불)를 막는 Toss 멱등키
  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const res = await fetch(`${TOSS_BASE_URL}/payments/${paymentKey}/cancel`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TOSS_TIMEOUT_MS),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { success: false, error: err.message || `Toss cancel error: ${res.status}` }
  }

  return { success: true }
}
