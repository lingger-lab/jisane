import { describe, expect, it } from 'vitest'
import { nextRovingIndex, rovingTabIndex } from './roving-focus'

describe('nextRovingIndex', () => {
  it('ArrowRight/ArrowDown은 다음 인덱스로 이동한다', () => {
    expect(nextRovingIndex('ArrowRight', 0, 5)).toBe(1)
    expect(nextRovingIndex('ArrowDown', 2, 5)).toBe(3)
  })

  it('ArrowLeft/ArrowUp은 이전 인덱스로 이동한다', () => {
    expect(nextRovingIndex('ArrowLeft', 3, 5)).toBe(2)
    expect(nextRovingIndex('ArrowUp', 1, 5)).toBe(0)
  })

  it('끝에서 처음으로, 처음에서 끝으로 순환한다', () => {
    expect(nextRovingIndex('ArrowRight', 4, 5)).toBe(0)
    expect(nextRovingIndex('ArrowLeft', 0, 5)).toBe(4)
  })

  it('Home/End는 처음/끝으로 이동한다', () => {
    expect(nextRovingIndex('Home', 3, 5)).toBe(0)
    expect(nextRovingIndex('End', 1, 5)).toBe(4)
  })

  it('해당 없는 키는 null (기본 동작 유지)', () => {
    expect(nextRovingIndex('Enter', 1, 5)).toBeNull()
    expect(nextRovingIndex(' ', 1, 5)).toBeNull()
    expect(nextRovingIndex('Tab', 1, 5)).toBeNull()
    expect(nextRovingIndex('a', 1, 5)).toBeNull()
  })

  it('빈 목록·범위 밖 인덱스는 null', () => {
    expect(nextRovingIndex('ArrowRight', 0, 0)).toBeNull()
    expect(nextRovingIndex('ArrowRight', -1, 5)).toBeNull()
    expect(nextRovingIndex('ArrowRight', 5, 5)).toBeNull()
  })

  it('항목 1개면 화살표 이동이 제자리를 반환한다', () => {
    expect(nextRovingIndex('ArrowRight', 0, 1)).toBe(0)
    expect(nextRovingIndex('ArrowLeft', 0, 1)).toBe(0)
  })
})

describe('rovingTabIndex', () => {
  it('선택 항목만 탭 스톱(0), 나머지는 -1', () => {
    expect(rovingTabIndex(2, 2)).toBe(0)
    expect(rovingTabIndex(0, 2)).toBe(-1)
    expect(rovingTabIndex(4, 2)).toBe(-1)
  })

  it('선택이 없으면 첫 항목이 탭 스톱', () => {
    expect(rovingTabIndex(0, -1)).toBe(0)
    expect(rovingTabIndex(1, -1)).toBe(-1)
  })
})
