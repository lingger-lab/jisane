/**
 * 로빙 탭인덱스(roving tabindex) 키보드 이동 계산 — 순수 함수.
 * WAI-ARIA APG의 radio group / tabs 패턴 공용:
 * 화살표(순환)·Home/End 이동, 선택 항목(없으면 첫 항목)만 탭 스톱.
 */

/** 키 입력에 대한 다음 포커스 인덱스. 해당 없는 키는 null (기본 동작 유지). */
export function nextRovingIndex(key: string, current: number, count: number): number | null {
  if (count <= 0 || current < 0 || current >= count) return null
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (current + 1) % count
    case 'ArrowLeft':
    case 'ArrowUp':
      return (current - 1 + count) % count
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

/** 로빙 탭인덱스: 선택 항목이 탭 스톱, 선택이 없으면 첫 항목이 탭 스톱. */
export function rovingTabIndex(index: number, selectedIndex: number): 0 | -1 {
  const stop = selectedIndex >= 0 ? selectedIndex : 0
  return index === stop ? 0 : -1
}
