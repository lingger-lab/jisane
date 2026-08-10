import { describe, it, expect } from 'vitest'
import { calcCapPricing } from './cap-pricing'

// 캡 가격 조합 로직 회귀 가드 (감사 docs/11 P3-104: estAmount 반올림 이슈 포함).

describe('calcCapPricing — hourlyRate × estHours 고정 정산', () => {
  it('50,000 × 4h = 200,000 → matchFee 30,000, guaranteeFee 3,000, totalPay 230,000', () => {
    const r = calcCapPricing(50000, 4)
    expect(r).toEqual({
      hourlyRate: 50000,
      estHours: 4,
      estAmount: 200000,
      capAmount: 200000,
      workFee: 200000,
      matchFee: 30000,
      guaranteeFee: 3000,
      totalPay: 230000,
    })
  })

  it('50,000 × 1h = 50,000 → 최소 매칭피 10,000 보장, totalPay 60,000', () => {
    const r = calcCapPricing(50000, 1)
    expect(r.workFee).toBe(50000)
    expect(r.matchFee).toBe(10000)
    expect(r.guaranteeFee).toBe(1000)
    expect(r.totalPay).toBe(60000)
  })

  it('capAmount는 estAmount와 동일(예상액 고정)', () => {
    const r = calcCapPricing(70000, 3)
    expect(r.capAmount).toBe(r.estAmount)
    expect(r.capAmount).toBe(210000)
  })

  it('workFee가 30,000 미만이면 거래 불가(throw) — calcMatchFee 전파', () => {
    // 10,000 × 2h = 20,000 < 30,000
    expect(() => calcCapPricing(10000, 2)).toThrow()
  })

  it('정수 입력이면 estAmount도 정수', () => {
    const r = calcCapPricing(33333, 3)
    expect(Number.isInteger(r.estAmount)).toBe(true)
    expect(r.estAmount).toBe(99999)
  })

  // 알려진 갭(docs/11 P3-104): hourlyRate가 소수면 estAmount/workFee가 반올림되지 않는다.
  // 현재 동작을 고정(pin)해 둔다 — 수정 시 이 기대값이 바뀌어야 함을 드러내기 위함.
  it('[알려진 갭] 소수 hourlyRate → estAmount 미반올림(현재 동작 고정)', () => {
    // 10,000.5 × 3 = 30,001.5 (거래 가능 구간이면서 소수)
    const r = calcCapPricing(10000.5, 3)
    expect(r.estAmount).toBe(30001.5)
    expect(Number.isInteger(r.estAmount)).toBe(false)
  })
})
