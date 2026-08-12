import { describe, it, expect } from 'vitest'
import {
  calcMatchFee,
  calcGuaranteeFee,
  calcVat,
  calcPayableAmount,
  calcDealPricing,
  DEAL_PRICING_DEFAULT_RATES,
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

// 구독 전환 설계 docs/16 §1.1 — calcDealPricing 단일 소스.
// §11.2 차감 유도 원칙: 독립 반올림(credit/pg/risk) 후 payout은 뺄셈 유도 →
// 불변식 total_pay = payout + pg + risk + credit 이 구성상 항상 성립해야 한다.

describe('calcDealPricing — docs/16 §1.1 구독 모델 거래 가격', () => {
  it('예시 W=1,000,000 (§1.1 표 그대로)', () => {
    expect(calcDealPricing(1_000_000)).toEqual({
      creditHoldAmt: 50_000,
      pgFeeAmt: 35_000,
      riskReserveAmt: 10_000,
      expertPayoutAmt: 955_000,
      totalPay: 1_050_000,
      matchFee: 0,
    })
  })

  it('기본 요율 상수 = 설계값(5% / 3.5% / 1%)', () => {
    expect(DEAL_PRICING_DEFAULT_RATES).toEqual({
      markup: 0.05,
      pgFee: 0.035,
      riskReserve: 0.01,
    })
  })

  it('소액 경계 W=30,000 (최소 작업비)', () => {
    const r = calcDealPricing(30_000)
    expect(r).toEqual({
      creditHoldAmt: 1_500,
      pgFeeAmt: 1_050,
      riskReserveAmt: 300,
      expertPayoutAmt: 28_650, // 잔여식: 30,000 − 1,050 − 300
      totalPay: 31_500,
      matchFee: 0,
    })
  })

  it('반올림 비정수 유발값 W=33,333 — 불변식 유지', () => {
    const r = calcDealPricing(33_333)
    expect(r.creditHoldAmt).toBe(1_667) // round(1,666.65)
    expect(r.pgFeeAmt).toBe(1_167) // round(1,166.655)
    expect(r.riskReserveAmt).toBe(333) // round(333.33)
    expect(r.expertPayoutAmt).toBe(33_333 - 1_167 - 333) // 31,833 (뺄셈 유도)
    expect(r.totalPay).toBe(33_333 + 1_667) // 35,000
    expect(r.totalPay).toBe(
      r.expertPayoutAmt + r.pgFeeAmt + r.riskReserveAmt + r.creditHoldAmt,
    )
  })

  it('match_fee는 항상 0 (컬럼 유지, 값만 0)', () => {
    expect(calcDealPricing(30_000).matchFee).toBe(0)
    expect(calcDealPricing(100_000_000).matchFee).toBe(0)
  })

  it('요율 오버라이드 (platform_config 값 주입 대비)', () => {
    const r = calcDealPricing(1_000_000, { markup: 0.1, pgFee: 0.03, riskReserve: 0.02 })
    expect(r.creditHoldAmt).toBe(100_000)
    expect(r.pgFeeAmt).toBe(30_000)
    expect(r.riskReserveAmt).toBe(20_000)
    expect(r.expertPayoutAmt).toBe(950_000)
    expect(r.totalPay).toBe(1_100_000)
    // 부분 오버라이드: 나머지는 기본값 유지
    const p = calcDealPricing(1_000_000, { pgFee: 0.03 })
    expect(p.creditHoldAmt).toBe(50_000)
    expect(p.pgFeeAmt).toBe(30_000)
    expect(p.riskReserveAmt).toBe(10_000)
  })

  it('잘못된 입력은 명확히 throw (음수·비정수·NaN)', () => {
    expect(() => calcDealPricing(-1)).toThrow()
    expect(() => calcDealPricing(1000.5)).toThrow()
    expect(() => calcDealPricing(NaN)).toThrow()
    expect(() => calcDealPricing(Infinity)).toThrow()
  })

  describe('property: 불변식 스윕 (§11.2, W = 30,000 ~ 100,000,000)', () => {
    // 결정적 스텝 스윕: 소수(prime) 스텝으로 반올림 잔여 케이스를 고르게 커버
    const sweep: number[] = []
    for (let w = 30_000; w <= 100_000_000; w += 12_347) sweep.push(w)
    // 대표값·경계값 보강
    sweep.push(
      30_000, 30_001, 33_333, 99_999, 100_000, 100_001,
      999_999, 1_000_000, 1_000_001, 49_999_999, 99_999_999, 100_000_000,
    )

    it(`총 ${sweep.length}개 샘플에서 total_pay === payout + pg + risk + credit`, () => {
      for (const w of sweep) {
        const r = calcDealPricing(w)
        const sum = r.expertPayoutAmt + r.pgFeeAmt + r.riskReserveAmt + r.creditHoldAmt
        expect(sum, `W=${w}: 불변식 위반 (total_pay=${r.totalPay}, sum=${sum})`).toBe(r.totalPay)
      }
    })

    it('expert_payout_amt ≥ 0 이고 모든 금액은 원 단위 정수', () => {
      for (const w of sweep) {
        const r = calcDealPricing(w)
        expect(r.expertPayoutAmt, `W=${w}: payout 음수`).toBeGreaterThanOrEqual(0)
        for (const [k, v] of Object.entries(r)) {
          expect(Number.isInteger(v), `W=${w}: ${k}=${v} 비정수`).toBe(true)
        }
      }
    })
  })

  // ── 적대적 검증(REFUTE) 반례 회귀 가드 — 수정 반영 후 GREEN. 반증 리포트 참조.
  describe('적대검증 반례 회귀 가드', () => {
    it('반례 1: 비유한/음수 요율은 fail-closed throw (payout<0 가드는 NaN<0===false로 fail-open이었음)', () => {
      // platform_config 오염(Number('bad')=NaN 등)이 현실 벡터 — NaN 금액이 하류(결제요청)로 유출되면 안 됨
      expect(() => calcDealPricing(1_000_000, { pgFee: NaN })).toThrow()
      expect(() => calcDealPricing(1_000_000, { markup: NaN })).toThrow()
      expect(() => calcDealPricing(1_000_000, { riskReserve: -0.01 })).toThrow()
      expect(() => calcDealPricing(1_000_000, { pgFee: Infinity })).toThrow()
    })

    it('반례 2: unsafe 정수 입력·안전정수 초과 결과는 throw — 불변식 붕괴 원천 차단', () => {
      // 2^53+18: unsafe 정수 입력 → 입력 가드 throw
      expect(() => calcDealPricing(9_007_199_254_741_010)).toThrow()
      // W는 안전정수지만 total_pay = W×1.05 가 2^53 초과 → 결과 가드 throw
      expect(() => calcDealPricing(Number.MAX_SAFE_INTEGER)).toThrow()
      // 대형이지만 실무 범위(DB int4 이내, 2^53 훨씬 아래) W는 정상 + 불변식 유지
      const r = calcDealPricing(2_000_000_000)
      expect(r.totalPay).toBe(
        r.expertPayoutAmt + r.pgFeeAmt + r.riskReserveAmt + r.creditHoldAmt,
      )
    })
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
