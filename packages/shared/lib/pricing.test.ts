import { describe, it, expect } from 'vitest'
import {
  calcMatchFee,
  calcGuaranteeFee,
  calcVat,
  calcPayableAmount,
  VAT_RATE,
} from './pricing'

// 금전 핵심 순수함수 회귀 가드 (감사 docs/11 P3-60/65: 이 파일에 테스트 전무였음).
// 마스터문서 v3.3 §5.1 7구간 매칭피 — 경계값 위주.

describe('calcMatchFee — 7구간 경계', () => {
  it('30,000원 미만은 거래 불가(throw)', () => {
    expect(() => calcMatchFee(29999)).toThrow()
    expect(() => calcMatchFee(0)).toThrow()
  })

  describe('구간1: 30,000~100,000 = max(20%, 10,000)', () => {
    it('하한 30,000 → 최소 10,000 보장(6,000 아님)', () => {
      expect(calcMatchFee(30000)).toBe(10000)
    })
    it('50,000 → 10,000 (round(10,000))', () => {
      expect(calcMatchFee(50000)).toBe(10000)
    })
    it('60,000 → 12,000 (20% 적용)', () => {
      expect(calcMatchFee(60000)).toBe(12000)
    })
    it('상한 100,000 → 20,000', () => {
      expect(calcMatchFee(100000)).toBe(20000)
    })
  })

  describe('구간2: 100,001~300,000 = 15%', () => {
    it('100,001 → 15,000 (구간1 상한 20,000보다 낮아지는 불연속 지점)', () => {
      expect(calcMatchFee(100001)).toBe(15000)
    })
    it('200,000 → 30,000', () => {
      expect(calcMatchFee(200000)).toBe(30000)
    })
    it('상한 300,000 → 45,000', () => {
      expect(calcMatchFee(300000)).toBe(45000)
    })
  })

  describe('구간3: 300,001~500,000 = 50,000 정액', () => {
    it('300,001 → 50,000', () => {
      expect(calcMatchFee(300001)).toBe(50000)
    })
    it('상한 500,000 → 50,000', () => {
      expect(calcMatchFee(500000)).toBe(50000)
    })
  })

  describe('구간4: 500,001~800,000 = 70,000 정액', () => {
    it('500,001 → 70,000', () => {
      expect(calcMatchFee(500001)).toBe(70000)
    })
    it('상한 800,000 → 70,000', () => {
      expect(calcMatchFee(800000)).toBe(70000)
    })
  })

  describe('구간5: 800,001~3,000,000 = 7%', () => {
    it('800,001 → 56,000 (구간4 상한 70,000보다 낮아지는 불연속 지점)', () => {
      expect(calcMatchFee(800001)).toBe(56000)
    })
    it('1,000,000 → 70,000', () => {
      expect(calcMatchFee(1000000)).toBe(70000)
    })
    it('상한 3,000,000 → 210,000', () => {
      expect(calcMatchFee(3000000)).toBe(210000)
    })
  })

  describe('구간6: 3,000,000 초과 = 5%', () => {
    it('3,000,001 → 150,000 (구간5 상한 210,000보다 낮아지는 불연속 지점)', () => {
      expect(calcMatchFee(3000001)).toBe(150000)
    })
    it('4,000,000 → 200,000', () => {
      expect(calcMatchFee(4000000)).toBe(200000)
    })
  })
})

describe('calcGuaranteeFee — matchFee의 10% 적립', () => {
  it('기본 10%', () => {
    expect(calcGuaranteeFee(10000)).toBe(1000)
    expect(calcGuaranteeFee(45000)).toBe(4500)
  })
  it('rate 인자 커스텀', () => {
    expect(calcGuaranteeFee(10000, 0.2)).toBe(2000)
  })
  it('반올림', () => {
    expect(calcGuaranteeFee(12345)).toBe(1235) // round(1234.5)
  })
})

describe('VAT — 공급가 별도 기준', () => {
  it('VAT_RATE는 10%', () => {
    expect(VAT_RATE).toBe(0.1)
  })
  it('calcVat = round(공급가 × 10%)', () => {
    expect(calcVat(200000)).toBe(20000)
    expect(calcVat(12345)).toBe(1235)
  })
  it('calcPayableAmount = 공급가 + VAT', () => {
    expect(calcPayableAmount(200000)).toBe(220000)
    expect(calcPayableAmount(0)).toBe(0)
  })
})
