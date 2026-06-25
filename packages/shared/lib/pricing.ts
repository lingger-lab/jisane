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

export function calcTotalPay(workFee: number): {
  workFee: number
  matchFee: number
  totalPay: number
} {
  const matchFee = calcMatchFee(workFee)
  return {
    workFee,
    matchFee,
    totalPay: workFee + matchFee,
  }
}
