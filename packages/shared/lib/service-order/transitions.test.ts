import { describe, it, expect } from 'vitest'
import { isValidServiceOrderTransition, nextServiceOrderStatuses } from './transitions'

describe('isValidServiceOrderTransition', () => {
  it('허용 전이', () => {
    expect(isValidServiceOrderTransition('pending', 'paid')).toBe(true)
    expect(isValidServiceOrderTransition('pending', 'processing')).toBe(true) // 무료 주문 결제 스킵
    expect(isValidServiceOrderTransition('pending', 'cancelled')).toBe(true)
    expect(isValidServiceOrderTransition('paid', 'processing')).toBe(true)
    expect(isValidServiceOrderTransition('processing', 'completed')).toBe(true)
    expect(isValidServiceOrderTransition('processing', 'cancelled')).toBe(true)
  })

  it('임의 점프 차단(red였던 케이스)', () => {
    expect(isValidServiceOrderTransition('pending', 'completed')).toBe(false)
    expect(isValidServiceOrderTransition('paid', 'completed')).toBe(false)
    expect(isValidServiceOrderTransition('pending', 'pending')).toBe(false)
  })

  it('역방향·터미널 이탈 차단', () => {
    expect(isValidServiceOrderTransition('completed', 'processing')).toBe(false)
    expect(isValidServiceOrderTransition('cancelled', 'pending')).toBe(false)
    expect(isValidServiceOrderTransition('paid', 'pending')).toBe(false)
  })

  it('미정의 상태는 불가', () => {
    expect(isValidServiceOrderTransition('bogus', 'paid')).toBe(false)
    expect(isValidServiceOrderTransition('pending', 'bogus')).toBe(false)
  })
})

describe('nextServiceOrderStatuses', () => {
  it('현재 상태의 유효 next만 반환', () => {
    expect(nextServiceOrderStatuses('pending')).toEqual(['paid', 'processing', 'cancelled'])
    expect(nextServiceOrderStatuses('processing')).toEqual(['completed', 'cancelled'])
    expect(nextServiceOrderStatuses('completed')).toEqual([])
    expect(nextServiceOrderStatuses('bogus')).toEqual([])
  })
})
