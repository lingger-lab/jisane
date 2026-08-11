import { calcMatchFee, calcGuaranteeFee } from './pricing'

export interface CapPricingResult {
  hourlyRate: number
  estHours: number
  estAmount: number
  capAmount: number
  workFee: number
  matchFee: number
  guaranteeFee: number
  totalPay: number
}

/**
 * 캡 가격 계산: hourly_rate × est_hours = 예상액 고정
 * cap_amount = est_amount (설계 확정: 예상액 고정 정산)
 */
export function calcCapPricing(hourlyRate: number, estHours: number): CapPricingResult {
  // 금액은 원(정수) — 소수 hourlyRate 등으로 분수가 나와도 반올림해 원장·결제와 정합(감사 docs/11 P3-104)
  const estAmount = Math.round(hourlyRate * estHours)
  const capAmount = estAmount
  const workFee = capAmount
  const matchFee = calcMatchFee(workFee)
  const guaranteeFee = calcGuaranteeFee(matchFee)
  const totalPay = workFee + matchFee

  return { hourlyRate, estHours, estAmount, capAmount, workFee, matchFee, guaranteeFee, totalPay }
}
