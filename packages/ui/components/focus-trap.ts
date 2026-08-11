/**
 * 모달/오버레이 키보드 트랩 계산 — 순수 함수.
 * WCAG 2.1.2(No Keyboard Trap 준수형 순환)·다이얼로그 패턴 공용:
 * Tab은 포커서블 목록 안에서 순환하고, Escape는 닫기를 지시한다.
 * DOM 접근 없음 — 호출처가 포커서블 목록·activeIndex를 넘기고 결과를 배선한다.
 */

export type TrapKeyResult =
  | { type: 'close' }
  | { type: 'focus'; index: number }
  | { type: 'none' }

/**
 * 키 입력에 대한 트랩 동작.
 * @param activeIndex 현재 포커스가 목록의 몇 번째 요소에 있는지 (-1 = 목록 밖)
 * @param count 트랩 내 포커서블 요소 수
 */
export function resolveTrapKey(
  key: string,
  shiftKey: boolean,
  activeIndex: number,
  count: number
): TrapKeyResult {
  if (key === 'Escape') return { type: 'close' }
  if (key !== 'Tab') return { type: 'none' }
  if (count <= 0) return { type: 'none' }

  // 포커스가 트랩 밖(-1)이면 첫 요소로 끌어온다.
  if (activeIndex < 0 || activeIndex >= count) return { type: 'focus', index: 0 }

  const next = shiftKey
    ? (activeIndex - 1 + count) % count
    : (activeIndex + 1) % count
  return { type: 'focus', index: next }
}
