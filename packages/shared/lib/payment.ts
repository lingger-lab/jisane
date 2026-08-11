/**
 * Toss Payments REST API 유틸 (마스터문서 v3.3 §5.3)
 * https://docs.tosspayments.com/reference
 */

const TOSS_BASE_URL = 'https://api.tosspayments.com/v1'
// 결제 승인·취소는 Toss가 카드사/은행을 경유하므로 평시 수 초, 지연 시 십수 초까지 걸릴 수 있다.
// p95 여유를 두어 30초로 설정(감사 docs/11 P3-X). 너무 짧으면 실제로는 성공한 승인/취소를
// 실패로 오판하는 재시도 위험이 커지고, 무한 대기는 라우트 전체를 매단다.
const TOSS_TIMEOUT_MS = 30_000

function getAuthHeader(): string {
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) throw new Error('TOSS_SECRET_KEY is not configured')
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${encoded}`
}

const ORDER_ID_PREFIX = 'jisane'

/**
 * orderId 형식 계약: `jisane_{dealId}_{timestamp}`
 * 생성(여기)과 해석(success 라우트·웹훅)이 서로 다른 파일에 있어 손으로 split하면
 * 구분자 하나만 바뀌어도 콜백이 조용히 전부 거부된다. 반드시 이 쌍을 통해서만 다룰 것.
 */
export function buildOrderId(dealId: string, timestamp: number): string {
  return `${ORDER_ID_PREFIX}_${dealId}_${timestamp}`
}

/** orderId에서 dealId를 복원한다. 형식이 어긋나면 null. */
export function parseOrderId(orderId: string): { dealId: string } | null {
  const parts = orderId.split('_')
  if (parts.length < 3 || parts[0] !== ORDER_ID_PREFIX || !parts[1]) return null
  return { dealId: parts[1] }
}

/**
 * 결제 기능 활성화 여부 (**서버 전용** — 시크릿 키 존재로 판정).
 * 토스 가맹 등록·키 발급 전에는 결제 UI를 "준비중"으로 노출하기 위한 게이트.
 * 키를 주입하면 별도 코드 변경 없이 결제가 켜진다.
 *
 * TOSS_SECRET_KEY는 클라이언트 번들에 없으므로, 브라우저에서 호출하면 키가 있어도
 * 조용히 false가 된다("결제 준비중"이 계속 뜨는 원인 불명 버그). 서버에서만 호출할 것.
 */
export function isPaymentEnabled(): boolean {
  if (typeof window !== 'undefined') {
    throw new Error('isPaymentEnabled는 서버에서만 호출할 수 있습니다')
  }
  return Boolean(process.env.TOSS_SECRET_KEY)
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

  const orderId = buildOrderId(dealId, Date.now())

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

  // checkout URL이 없으면 결제창을 띄울 수 없다. 빈 문자열로 대체하면 호출자가
  // "일시적 실패"로 표시하고 끝나, 아무도 도달할 수 없는 결제 세션만 남는다.
  if (!data.checkout?.url) {
    throw new Error('Toss 응답에 checkout URL이 없습니다')
  }

  return {
    paymentKey: data.paymentKey,
    checkoutUrl: data.checkout.url,
  }
}

/**
 * 결제 승인 (Toss에서 redirect 후 서버에서 호출)
 *
 * 에러 계약: **절대 throw하지 않는다.** HTTP 에러든 타임아웃/네트워크 장애든 항상
 * `{success:false}`로 반환한다. 호출자(confirmAndRecordDeposit)는 success만 검사하므로,
 * 여기서 throw하면 웹훅·리다이렉트 양쪽에서 처리되지 않은 예외가 라우트 밖으로 새어나간다.
 */
export async function confirmPayment(
  paymentKey: string,
  orderId: string,
  amount: number
): Promise<{ success: boolean; data?: Record<string, unknown>; error?: string; code?: string }> {
  let res: Response
  try {
    res = await fetch(`${TOSS_BASE_URL}/payments/confirm`, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
        // 타임아웃 후 재시도(웹훅 재전송)가 이중 승인이 되지 않도록 고정 키를 보낸다.
        'Idempotency-Key': orderId,
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
      signal: AbortSignal.timeout(TOSS_TIMEOUT_MS),
    })
  } catch (err) {
    // 타임아웃/네트워크 실패 — 승인 여부 불명. 호출자가 재시도(non-2xx)하도록 실패로 반환한다.
    return {
      success: false,
      error: err instanceof Error ? `Toss confirm 요청 실패: ${err.message}` : 'Toss confirm 요청 실패',
    }
  }

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
 *
 * 에러 계약: confirmPayment와 동일하게 **절대 throw하지 않는다.** 타임아웃/네트워크 장애도
 * `{success:false}`로 반환한다. 호출자(refund 라우트)는 success만 검사하므로, 여기서 throw하면
 * 처리되지 않은 예외가 라우트 밖으로 새어나간다(감사 docs/11 P2-63). 타임아웃 시점에 Toss에서
 * 취소가 이미 실행됐을 수 있으므로, 재시도는 반드시 동일 idempotencyKey로 해야 한다.
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

  let res: Response
  try {
    res = await fetch(`${TOSS_BASE_URL}/payments/${paymentKey}/cancel`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TOSS_TIMEOUT_MS),
    })
  } catch (err) {
    // 타임아웃/네트워크 실패 — 취소 실행 여부 불명. 로컬 상태를 refunded로 만들지 않도록
    // 실패로 반환하고, 호출자가 동일 멱등키로 재시도하게 한다.
    return {
      success: false,
      error: err instanceof Error ? `Toss 취소 요청 실패: ${err.message}` : 'Toss 취소 요청 실패',
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { success: false, error: err.message || `Toss cancel error: ${res.status}` }
  }

  return { success: true }
}
