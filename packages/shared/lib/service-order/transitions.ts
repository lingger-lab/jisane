/**
 * service_order 상태 전이 규칙 — 순수 함수(DB 접근 없음, 단위테스트 대상).
 * 레일A(카탈로그 주문) 상태머신의 유효 전이만 허용해 관리자 임의 점프(pending→completed 등)를 차단한다.
 *
 * pending  → paid | processing | cancelled   (무료/가격0 주문은 paid 라벨 스킵 가능)
 * paid     → processing | cancelled
 * processing → completed | cancelled
 * completed / cancelled → (터미널)
 */

const VALID_NEXT: Record<string, readonly string[]> = {
  pending: ['paid', 'processing', 'cancelled'],
  paid: ['processing', 'cancelled'],
  processing: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

/** from→to 전이가 허용되는지. 동일 상태(no-op)·미정의 상태는 불가. */
export function isValidServiceOrderTransition(from: string, to: string): boolean {
  return VALID_NEXT[from]?.includes(to) ?? false
}

/** 현재 상태에서 관리자가 선택 가능한 다음 상태 목록(UI 셀렉터용). */
export function nextServiceOrderStatuses(from: string): readonly string[] {
  return VALID_NEXT[from] ?? []
}
