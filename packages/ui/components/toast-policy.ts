/**
 * 토스트 지속 정책 (감사 docs/10 P2-50 · T26).
 *
 * 결제류 안내는 읽고 행동해야 하는 내용(결제내역 확인·고객센터 문의)인데, 토스트가
 * 뜨는 순간 ?error=/?success=는 이미 URL에서 제거되므로 자동 소멸을 놓치면 다시
 * 볼 방법이 없다. 그래서 결제류 에러는 수동 닫기 전까지 유지하고, 결제 성공은
 * 노출 시간을 연장한다. 저부담 코드는 기존 자동 소멸을 유지한다.
 */

/** 일반 성공 토스트 자동 소멸(ms) */
export const SUCCESS_DISMISS_MS = 3000
/** 결제류 성공 토스트 — 연장 노출(ms) */
export const CRITICAL_SUCCESS_DISMISS_MS = 8000
/** 일반 에러 토스트 자동 소멸(ms) */
export const ERROR_DISMISS_MS = 4000

/** 결제류 성공 코드 — 자동 소멸을 연장한다. */
const CRITICAL_SUCCESS_CODES: ReadonlySet<string> = new Set(['payment'])

/** 결제류 에러 코드 — 자동 소멸 없이 수동 닫기로만 사라진다. */
const CRITICAL_ERROR_CODES: ReadonlySet<string> = new Set([
  'payment',
  'payment_failed',
  'payment_invalid',
])

/** 성공 코드의 자동 소멸 시간(ms). */
export function successDismissMs(code: string): number {
  return CRITICAL_SUCCESS_CODES.has(code) ? CRITICAL_SUCCESS_DISMISS_MS : SUCCESS_DISMISS_MS
}

/** 에러 코드의 자동 소멸 시간(ms). null이면 수동 닫기 전까지 유지. */
export function errorDismissMs(code: string): number | null {
  return CRITICAL_ERROR_CODES.has(code) ? null : ERROR_DISMISS_MS
}
