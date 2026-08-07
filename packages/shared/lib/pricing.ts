/**
 * 지사네 7구간 매칭피 계산 (마스터문서 v3.3 §5.1)
 * VAT 별도 기준
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
