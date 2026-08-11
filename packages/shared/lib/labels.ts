/** 상태 라벨 상수 — 앱 간 공유 */

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  open: '접수',
  matching: '매칭 중',
  dealt: '진행 중',
  closed: '완료',
}

export const DEAL_STATUS_LABELS: Record<string, string> = {
  quoted: '견적',
  working: '진행 중',
  done: '완료',
  cancelled: '취소',
}

export const MATCHING_STATUS_LABELS: Record<string, string> = {
  proposed: '제안',
  accepted: '수락',
  rejected: '거절',
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: '접수',
  paid: '결제 완료',
  processing: '진행 중',
  completed: '완료',
  cancelled: '취소',
}

export const EXPERT_GRADE_LABELS: Record<string, string> = {
  veteran: '베테랑',
  standard: '시니어지식인',
  new: '신규',
}

export const WORKFLOW_STEP_LABELS: Record<string, string> = {
  intake: '요건 파악',
  structure: '구조화',
  generate: '작업 수행',
  verify: '검증',
  deliver: '납품',
}

export const STEP_STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  in_progress: '진행 중',
  done: '완료',
}

export const INVITATION_STATUS_LABELS: Record<string, string> = {
  invited: '초빙 대기',
  accepted: '수락',
  declined: '거절',
}

export const DISPUTE_STATUS_LABELS: Record<string, string> = {
  open: '처리 중',
  resolved: '해결',
}

export const DISPUTE_TARGET_LABELS: Record<string, string> = {
  review: '리뷰',
  settlement: '정산',
}

export const DISPUTE_RAISED_BY_LABELS: Record<string, string> = {
  owner: '기업회원',
  expert: '시니어지식인',
  admin: '관리자',
}

/** 회원 유형 공식 명칭 (박희중 이사 방향 문서 2026-08 — 가입·안내 공용) */
export const MEMBER_TYPE_LABELS: Record<string, string> = {
  owner: '기업회원',
  expert: '시니어지식인회원',
  provider: '전문가회원',
}

export const ACTIVITY_TYPE_LABELS: Record<string, string> = {
  band_join: '밴드 가입',
  post: '게시글 작성',
}

export const ESCROW_STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  deposited: '입금 완료',
  reviewing: '검수 중',
  released: '정산 완료',
  refunded: '환불',
}

export const PROVIDER_STATUS_LABELS: Record<string, string> = {
  pending: '승인 대기',
  active: '활동 중',
  rejected: '반려',
  suspended: '중지',
}

export const PACKAGE_STATUS_LABELS: Record<string, string> = {
  draft: '비공개 (검수 대기)',
  published: '공개 중',
  archived: '보관',
}

export const PROVIDER_KIND_LABELS: Record<string, string> = {
  company: '기업',
  senior: '시니어지식인',
}

export const PROVIDER_TYPE_LABELS: Record<string, string> = {
  consulting: '컨설팅',
  legal: '법무',
  tax: '세무',
  accounting: '회계',
  insurance: '보험',
}
