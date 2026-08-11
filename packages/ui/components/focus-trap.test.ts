import { describe, expect, it } from 'vitest'
import { resolveTrapKey } from './focus-trap'

describe('resolveTrapKey', () => {
  it('Escape는 항상 close를 지시한다', () => {
    expect(resolveTrapKey('Escape', false, 0, 3)).toEqual({ type: 'close' })
    expect(resolveTrapKey('Escape', true, -1, 0)).toEqual({ type: 'close' })
  })

  it('Tab은 다음 요소로 순환한다 (마지막→처음)', () => {
    expect(resolveTrapKey('Tab', false, 0, 3)).toEqual({ type: 'focus', index: 1 })
    expect(resolveTrapKey('Tab', false, 2, 3)).toEqual({ type: 'focus', index: 0 })
  })

  it('Shift+Tab은 이전 요소로 순환한다 (처음→마지막)', () => {
    expect(resolveTrapKey('Tab', true, 1, 3)).toEqual({ type: 'focus', index: 0 })
    expect(resolveTrapKey('Tab', true, 0, 3)).toEqual({ type: 'focus', index: 2 })
  })

  it('포커서블 1개면 Tab이 제자리를 유지한다 (스플래시 오버레이 케이스)', () => {
    expect(resolveTrapKey('Tab', false, 0, 1)).toEqual({ type: 'focus', index: 0 })
    expect(resolveTrapKey('Tab', true, 0, 1)).toEqual({ type: 'focus', index: 0 })
  })

  it('포커스가 트랩 밖(-1·범위 밖)이면 첫 요소로 끌어온다', () => {
    expect(resolveTrapKey('Tab', false, -1, 3)).toEqual({ type: 'focus', index: 0 })
    expect(resolveTrapKey('Tab', true, 5, 3)).toEqual({ type: 'focus', index: 0 })
  })

  it('포커서블이 없으면 none (기본 동작 유지)', () => {
    expect(resolveTrapKey('Tab', false, -1, 0)).toEqual({ type: 'none' })
  })

  it('해당 없는 키는 none (기본 동작 유지)', () => {
    expect(resolveTrapKey('Enter', false, 0, 3)).toEqual({ type: 'none' })
    expect(resolveTrapKey('ArrowDown', false, 0, 3)).toEqual({ type: 'none' })
    expect(resolveTrapKey('a', false, 0, 3)).toEqual({ type: 'none' })
  })
})
