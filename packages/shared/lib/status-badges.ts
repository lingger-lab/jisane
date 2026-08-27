/**
 * 상태 → 배지 색 클래스 매핑 — 앱 간 공유 단일 소스 (UX 감사 docs/10 P2-46).
 *
 * labels.ts의 *_STATUS_LABELS와 키가 1:1로 대응한다(status-badges.test.ts가 고정).
 * 값은 D1 커밋(03191a9)이 확정한 시맨틱 토큰 클래스 체계(info/warning/success/error +
 * *-light 서피스)를 각 앱의 로컬 사본에서 그대로 옮긴 것 — 색 변경 없음.
 * 새 상태를 추가할 때는 라벨과 배지 클래스를 함께 추가할 것(한쪽만 추가하면
 * 일부 화면은 회색 폴백으로 렌더된다).
 */

export const REQUEST_STATUS_BADGE_CLASSES: Record<string, string> = {
  open: 'bg-info-light text-info',
  matching: 'bg-warning-light text-warning',
  dealt: 'bg-success-light text-success',
  closed: 'bg-surface text-text-subtle',
}

export const DEAL_STATUS_BADGE_CLASSES: Record<string, string> = {
  quoted: 'bg-info-light text-info',
  working: 'bg-warning-light text-warning',
  done: 'bg-success-light text-success',
  cancelled: 'bg-error-light text-error',
}

export const MATCHING_STATUS_BADGE_CLASSES: Record<string, string> = {
  proposed: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  rejected: 'bg-error-light text-error',
}

export const ORDER_STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-info-light text-info',
  paid: 'bg-warning-light text-warning',
  processing: 'bg-success-light text-success',
  completed: 'bg-surface text-text-subtle',
  cancelled: 'bg-error-light text-error',
}

export const INVITATION_STATUS_BADGE_CLASSES: Record<string, string> = {
  invited: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  declined: 'bg-error-light text-error',
}

export const DISPUTE_STATUS_BADGE_CLASSES: Record<string, string> = {
  open: 'bg-error-light text-error',
  resolved: 'bg-success-light text-success',
}

export const PACKAGE_STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: 'bg-warning-light text-warning',
  published: 'bg-success-light text-success',
  archived: 'bg-surface text-text-subtle',
}

export const PROVIDER_STATUS_BADGE_CLASSES: Record<string, string> = {
  pending: 'bg-warning-light text-warning',
  active: 'bg-success-light text-success',
  rejected: 'bg-error-light text-error',
  suspended: 'bg-surface text-text-subtle',
}

/** 회원 계정 상태 배지 — 색 무변경(AA 동결). MEMBER_STATUS_LABELS와 쌍. */
export const MEMBER_STATUS_BADGE_CLASSES: Record<string, string> = {
  active: 'bg-primary/10 text-primary',
  inactive: 'bg-surface text-text-muted',
  waiting: 'bg-warning-light text-warning',
  suspended: 'bg-error-light text-error',
  pending: 'bg-warning-light text-warning',
  rejected: 'bg-error-light text-error',
  withdrawn: 'bg-surface text-text-subtle',
}
