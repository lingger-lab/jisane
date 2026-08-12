/**
 * 지사네 7구간 매칭피 계산 (마스터문서 v3.3 §5.1)
 * VAT 별도 기준
 *
 * @deprecated 구독 전환(docs/16 §1.1) 이후 신규 거래는 match_fee=0 —
 * `calcDealPricing` 사용. 기존(grandfather) 거래 경로 전용으로만 유지.
 */
export function calcMatchFee(workFee: number): number {
  if (workFee < 30000) {
    throw new Error('최소 작업비는 30,000원입니다 (거래 불가 구간)')
  }
  if (workFee <= 100000) {
    return Math.max(Math.round(workFee * 0.2), 10000)
  }
  if (workFee <= 300000) {
    return Math.round(workFee * 0.15)
  }
  if (workFee <= 500000) {
    return 50000
  }
  if (workFee <= 800000) {
    return 70000
  }
  if (workFee <= 3000000) {
    return Math.round(workFee * 0.07)
  }
  return Math.round(workFee * 0.05)
}

/**
 * 지사네 책임 적립금 (마스터문서 v3.3 §5.2)
 * matchFee의 10%를 guarantee_fund_ledger에 적립
 */
export function calcGuaranteeFee(matchFee: number, rate = 0.1): number {
  return Math.round(matchFee * rate)
}

// ─────────────────────────────────────────────────────────────────────────────
// 구독 모델 거래 가격 (docs/16_SUBSCRIPTION_DESIGN_2026-08-12.md §1.1)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * §1.1 기본 요율. platform_config 시드값(work_price_markup·expert_pg_fee·
 * expert_risk_reserve)과 동일해야 한다.
 */
export const DEAL_PRICING_DEFAULT_RATES = {
  /** 기업부담 크레딧 보류율 (5%) */
  markup: 0.05,
  /** 결제수수료 충당률 (3.5%, UI 비표시) */
  pgFee: 0.035,
  /** 위험적립률 (1%, UI 비표시) */
  riskReserve: 0.01,
} as const

/** 요율 오버라이드 — 생략된 항목은 설계 기본값 사용 */
export interface DealPricingRates {
  markup?: number
  pgFee?: number
  riskReserve?: number
}

/**
 * 거래 1건 가격 파생 결과 (docs/16 §1.1 표의 저장 컬럼과 1:1 대응).
 * VAT는 포함하지 않는다 — 작업비 결제 VAT는 §10-2 미정 게이트,
 * calcVat는 구독 invoice에서만 사용.
 */
export interface DealPricingResult {
  /** 크레딧 보류분(기업부담 5%) → settlement.credit_hold_amt */
  creditHoldAmt: number
  /** 결제수수료 충당(3.5%, UI 비표시) → settlement.pg_fee_amt */
  pgFeeAmt: number
  /** 위험적립(1%, UI 비표시) → settlement.risk_reserve_amt */
  riskReserveAmt: number
  /** 시니어 수령액(잔여식) → settlement.expert_payout_amt */
  expertPayoutAmt: number
  /** 기업 결제액(작업가격, 단일 표시) → deal.total_pay */
  totalPay: number
  /** 매칭비 — 구독 모델에서 항상 0 (컬럼 유지) → deal.match_fee */
  matchFee: 0
}

/**
 * 구독 모델 거래 가격 단일 소스 (docs/16 §1.1·§8.2).
 *
 * §11.2 차감 유도 원칙: 독립 반올림은 credit/pg/risk 3개만 하고,
 * 시니어 수령액은 `W − pg − risk` **뺄셈으로 유도**해 반올림 오차를 흡수한다.
 * 따라서 불변식 `total_pay === payout + pg + risk + credit`이 구성상 항상 성립.
 *
 * @param workFee 시니어가 설정한 작업비 W (원 단위 정수)
 * @param rates 요율 오버라이드 (platform_config 주입용) — 생략 시 설계 기본값
 */
export function calcDealPricing(
  workFee: number,
  rates: DealPricingRates = {},
): DealPricingResult {
  // 안전 정수(≤2^53-1)만 허용 — unsafe 정수는 아래 반올림·덧셈에서 배정밀도 오차로
  // 불변식이 깨진다(적대검증 반례 2).
  if (!Number.isSafeInteger(workFee) || workFee < 0) {
    throw new Error(`작업비는 0 이상의 안전 정수여야 합니다 (입력: ${workFee})`)
  }
  const markup = rates.markup ?? DEAL_PRICING_DEFAULT_RATES.markup
  const pgFee = rates.pgFee ?? DEAL_PRICING_DEFAULT_RATES.pgFee
  const riskReserve = rates.riskReserve ?? DEAL_PRICING_DEFAULT_RATES.riskReserve
  // 요율 검증 — platform_config(DB) 주입 경로라 Number('오염')=NaN이 현실 벡터.
  // `??`는 null/undefined만 잡고 NaN/음수/Infinity는 통과시켜, 아래 payout<0 가드가
  // NaN<0===false로 fail-open 된다(적대검증 반례 1). 명시적으로 fail-closed.
  for (const [name, rate] of [
    ['markup', markup],
    ['pgFee', pgFee],
    ['riskReserve', riskReserve],
  ] as const) {
    if (!Number.isFinite(rate) || rate < 0) {
      throw new Error(`요율 ${name}는 0 이상의 유한수여야 합니다 (입력: ${rate})`)
    }
  }

  const creditHoldAmt = Math.round(workFee * markup)
  const pgFeeAmt = Math.round(workFee * pgFee)
  const riskReserveAmt = Math.round(workFee * riskReserve)
  // 잔여식(§11.2) — 반올림은 위 3개에서만, 수령액은 뺄셈 유도로 오차 흡수
  const expertPayoutAmt = workFee - pgFeeAmt - riskReserveAmt
  const totalPay = workFee + creditHoldAmt

  // 결과 정합 가드: total_pay = W + credit_hold 가 안전 정수 범위를 넘으면
  // 배정밀도 덧셈에서 불변식(total === payout+pg+risk+credit)이 1원 붕괴한다
  // (적대검증 반례 2 — W가 안전 정수라도 W×1.05가 2^53을 넘을 수 있음). 차단.
  if (!Number.isSafeInteger(totalPay)) {
    throw new Error(`결과 금액이 안전 정수 범위를 초과했습니다 (workFee=${workFee})`)
  }

  // 금전 안전 가드: 비정상 요율(합계 >100%)로 수령액이 음수가 되면 fail-closed
  if (expertPayoutAmt < 0) {
    throw new Error(
      `수령액이 음수입니다 (workFee=${workFee}, pgFee=${pgFeeAmt}, riskReserve=${riskReserveAmt}) — 요율 설정을 확인하세요`,
    )
  }

  return { creditHoldAmt, pgFeeAmt, riskReserveAmt, expertPayoutAmt, totalPay, matchFee: 0 }
}

/** 부가가치세율 */
export const VAT_RATE = 0.1

/**
 * 청구 금액 단일 소스 (마스터문서 v3.3 §5.1 "VAT 별도 기준").
 *
 * deal.total_pay 는 **공급가**(VAT 제외)다. 고객이 실제로 결제하는 금액은
 * 공급가 + 부가세이며, 견적서·거래명세서의 "총 결제 예정액"과 반드시 같아야 한다.
 * 결제·환불한도·문서 합계는 전부 이 함수에서 파생시킬 것 — 두 곳에서 따로 계산하면
 * 청구액과 문서가 어긋난다(실제로 어긋나 있었다: 결제는 공급가만 청구).
 */
export function calcVat(supplyAmount: number): number {
  return Math.round(supplyAmount * VAT_RATE)
}

export function calcPayableAmount(supplyAmount: number): number {
  return supplyAmount + calcVat(supplyAmount)
}
