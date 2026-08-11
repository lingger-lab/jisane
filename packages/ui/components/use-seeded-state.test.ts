import { describe, expect, it, vi, beforeEach } from 'vitest'

// 경계 목: React useState만 최소 셰이딩(렌더 셀 + 렌더 중 setState 재렌더 루프).
// jsdom/렌더러 없이 훅의 재동기화 로직(렌더 중 setState 패턴)을 검증하기 위한 것으로,
// React의 "render-phase setState는 즉시 재렌더" 규약을 그대로 흉내낸다.
const harness = {
  cells: [] as unknown[],
  cursor: 0,
  rerenderScheduled: false,
}

vi.mock('react', () => ({
  useState: (init: unknown) => {
    const i = harness.cursor++
    if (!(i in harness.cells)) {
      harness.cells[i] = typeof init === 'function' ? (init as () => unknown)() : init
    }
    const set = (v: unknown) => {
      harness.cells[i] = typeof v === 'function' ? (v as (p: unknown) => unknown)(harness.cells[i]) : v
      harness.rerenderScheduled = true
    }
    return [harness.cells[i], set]
  },
}))

import { useSeededState } from './use-seeded-state'

/** 한 번의 "렌더" — 렌더 중 setState가 있으면 React처럼 즉시 재실행 */
function render<R>(fn: () => R): R {
  let out: R
  let guard = 0
  do {
    harness.rerenderScheduled = false
    harness.cursor = 0
    out = fn()
    if (++guard > 10) throw new Error('render loop')
  } while (harness.rerenderScheduled)
  return out
}

beforeEach(() => {
  harness.cells = []
  harness.cursor = 0
  harness.rerenderScheduled = false
})

describe('useSeededState — stale-prop 재동기화', () => {
  it('최초 렌더는 seed(prop)으로 초기화한다', () => {
    const ids = ['a', 'b']
    const [state] = render(() => useSeededState(ids, (p) => new Set(p)))
    expect(state).toEqual(new Set(['a', 'b']))
  })

  it('같은 prop 참조로 재렌더하면 로컬 setState 값이 유지된다 (입력 중 리셋 금지)', () => {
    const seedProp = 'from-url'
    let result = render(() => useSeededState(seedProp, (p) => p))
    result[1]('typing…')
    result = render(() => useSeededState(seedProp, (p) => p))
    expect(result[0]).toBe('typing…')
  })

  it('prop 참조가 바뀌면 새 prop으로 재동기화한다 (서버가 진실원)', () => {
    // RSC 경계 prop은 서버 스냅샷마다 참조가 고정 — 스냅샷당 하나의 배열로 모델링
    const snapshot1 = ['a']
    const snapshot2 = ['a', 'server']
    let result = render(() => useSeededState(snapshot1, (p) => new Set(p)))
    result[1](new Set(['a', 'local']))
    // 서버 revalidate → 새 배열 참조 도착
    result = render(() => useSeededState(snapshot2, (p) => new Set(p)))
    expect(result[0]).toEqual(new Set(['a', 'server']))
  })

  it('재동기화 후에도 다시 로컬 수정이 가능하다 (재적용 멱등)', () => {
    const first = ['a']
    let result = render(() => useSeededState(first, (p) => new Set(p)))
    const second = ['b']
    result = render(() => useSeededState(second, (p) => new Set(p)))
    result[1]((prev) => new Set(prev).add('c'))
    result = render(() => useSeededState(second, (p) => new Set(p)))
    expect(result[0]).toEqual(new Set(['b', 'c']))
  })

  it('원시값 prop도 값 비교로 동작한다 (같은 문자열이면 리셋하지 않음)', () => {
    let result = render(() => useSeededState('q1', (p) => p))
    result[1]('edited')
    // 서버 재렌더가 같은 문자열을 다시 내려도 (새 렌더, 동일 값) 리셋 없음
    result = render(() => useSeededState('q1', (p) => p))
    expect(result[0]).toBe('edited')
    // URL이 실제로 바뀌면 재동기화
    result = render(() => useSeededState('q2', (p) => p))
    expect(result[0]).toBe('q2')
  })
})
