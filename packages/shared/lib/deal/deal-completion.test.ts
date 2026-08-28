import { describe, it, expect } from 'vitest'
import { isDealCompleted, deriveDealPhase } from './deal-completion'

describe('isDealCompleted', () => {
  it('done + released만 완료', () => {
    expect(isDealCompleted('done', 'released')).toBe(true)
    expect(isDealCompleted('done', 'reviewing')).toBe(false)
    expect(isDealCompleted('working', 'released')).toBe(false)
    expect(isDealCompleted('done', null)).toBe(false)
  })
})

describe('deriveDealPhase', () => {
  it('견적/진행/검수대기', () => {
    expect(deriveDealPhase('quoted', 'pending')).toBe('견적')
    expect(deriveDealPhase('working', 'deposited', false)).toBe('진행 중')
    expect(deriveDealPhase('working', 'deposited', true)).toBe('검수 대기')
  })
  it('done은 escrow로 구분', () => {
    expect(deriveDealPhase('done', 'reviewing')).toBe('검수 완료 · 정산 대기')
    expect(deriveDealPhase('done', 'released')).toBe('거래완료')
  })
})
