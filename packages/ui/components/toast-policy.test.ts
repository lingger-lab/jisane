import { describe, it, expect } from 'vitest'
import {
  successDismissMs,
  errorDismissMs,
  SUCCESS_DISMISS_MS,
  CRITICAL_SUCCESS_DISMISS_MS,
  ERROR_DISMISS_MS,
} from './toast-policy'

// 감사 docs/10 P2-50: 결제 에러 토스트가 4초 만에 자동 소멸해 복구 불가.
// 결제류 에러 = 수동 닫기 전까지 유지(null), 결제 성공 = 연장 노출을 고정한다.
describe('toast-policy', () => {
  it('결제류 에러 코드는 자동 소멸하지 않는다(null)', () => {
    expect(errorDismissMs('payment')).toBeNull()
    expect(errorDismissMs('payment_failed')).toBeNull()
    expect(errorDismissMs('payment_invalid')).toBeNull()
  })

  it('저부담 에러 코드는 기존 자동 소멸을 유지한다', () => {
    expect(errorDismissMs('unauthorized')).toBe(ERROR_DISMISS_MS)
    expect(errorDismissMs('not_found')).toBe(ERROR_DISMISS_MS)
    // 맵에 없는 임의 코드(server_error 폴백 렌더)도 자동 소멸
    expect(errorDismissMs('unknown_code')).toBe(ERROR_DISMISS_MS)
  })

  it('결제 성공 코드는 연장 노출, 일반 성공 코드는 기본 노출', () => {
    expect(successDismissMs('payment')).toBe(CRITICAL_SUCCESS_DISMISS_MS)
    expect(CRITICAL_SUCCESS_DISMISS_MS).toBeGreaterThan(SUCCESS_DISMISS_MS)
    expect(successDismissMs('saved')).toBe(SUCCESS_DISMISS_MS)
    expect(successDismissMs('request_created')).toBe(SUCCESS_DISMISS_MS)
  })
})
