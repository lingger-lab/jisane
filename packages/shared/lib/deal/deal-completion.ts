/**
 * 거래완료 판정·단계 라벨 — 순수 함수(DB 접근 없음).
 * 거래완료의 유일한 진실원은 settlement.escrow_status='released'(deal은 done에 머무름).
 * 별도 완료 컬럼을 만들지 않고 표시만 파생해 auto-settlement와의 이중 진실원 드리프트를 막는다.
 */

/** 거래완료 여부 — deal done + escrow released. */
export function isDealCompleted(dealStatus: string, escrowStatus: string | null | undefined): boolean {
  return dealStatus === 'done' && escrowStatus === 'released'
}

/** 회원 화면 표시용 단계 라벨(파생). workSubmitted는 working 중 '검수 대기' 구분에만 사용. */
export function deriveDealPhase(
  dealStatus: string,
  escrowStatus: string | null | undefined,
  workSubmitted = false,
): string {
  if (dealStatus === 'quoted') return '견적'
  if (dealStatus === 'working') return workSubmitted ? '검수 대기' : '진행 중'
  if (dealStatus === 'done') {
    if (escrowStatus === 'released') return '거래완료'
    return '검수 완료 · 정산 대기'
  }
  return dealStatus
}
