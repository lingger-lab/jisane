'use client'

import { useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

/**
 * 서버 prop을 시드로 쓰는 로컬 상태 — prop이 바뀌면(참조 비교) prop 값으로 재동기화한다.
 *
 * 감사 stale-prop useState 테마(코드 P2-6/P2-25/P3-40/P3-43, UX P2-51):
 * `useState(prop)`의 초기값은 최초 마운트에만 적용되므로, revalidatePath 등으로
 * 서버가 새 prop을 내려도 화면은 옛 스냅샷을 유지한다(진실원 2개).
 * 이 훅은 "무엇으로 시드했는지"를 함께 기억해 두었다가 다른 prop이 오면 렌더 중
 * 재동기화한다(React 공식 "adjusting state when props change" 패턴 — 렌더 중
 * setState는 해당 컴포넌트에 한해 즉시 재렌더되며 커밋 전이므로 안전).
 *
 * 계약: 서버 prop이 진실원이고, 로컬 setState는 다음 서버 스냅샷이 도착할 때까지의
 * 낙관적 오버레이다. 서버 prop이 갱신되면 로컬 수정분은 폐기된다(전체 재도색).
 */
export function useSeededState<P, T = P>(
  prop: P,
  seed: (prop: P) => T,
): [T, Dispatch<SetStateAction<T>>] {
  const [seededFrom, setSeededFrom] = useState(prop)
  const [state, setState] = useState(() => seed(prop))

  if (seededFrom !== prop) {
    setSeededFrom(prop)
    setState(seed(prop))
  }

  return [state, setState]
}
