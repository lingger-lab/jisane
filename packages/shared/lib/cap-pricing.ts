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
  const estAmount = hourlyRate * estHours
  const capAmount = estAmount
  const workFee = capAmount
  const matchFee = calcMatchFee(workFee)
  const guaranteeFee = calcGuaranteeFee(matchFee)
  const totalPay = workFee + matchFee

  return { hourlyRate, estHours, estAmount, capAmount, workFee, matchFee, guaranteeFee, totalPay }
}
