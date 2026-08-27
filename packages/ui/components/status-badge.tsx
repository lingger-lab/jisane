import * as React from 'react'
import {
  REQUEST_STATUS_LABELS,
  DEAL_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  INVITATION_STATUS_LABELS,
  MATCHING_STATUS_LABELS,
  DISPUTE_STATUS_LABELS,
  PROVIDER_STATUS_LABELS,
  PACKAGE_STATUS_LABELS,
  MEMBER_STATUS_LABELS,
} from '@jisane/shared/labels'
import {
  REQUEST_STATUS_BADGE_CLASSES,
  DEAL_STATUS_BADGE_CLASSES,
  ORDER_STATUS_BADGE_CLASSES,
  INVITATION_STATUS_BADGE_CLASSES,
  MATCHING_STATUS_BADGE_CLASSES,
  DISPUTE_STATUS_BADGE_CLASSES,
  PROVIDER_STATUS_BADGE_CLASSES,
  PACKAGE_STATUS_BADGE_CLASSES,
  MEMBER_STATUS_BADGE_CLASSES,
} from '@jisane/shared/status-badges'
import { cn } from '../lib/cn'

/**
 * 상태 배지 어댑터 — kind+status로 라벨·색을 단일 소스(labels.ts·status-badges.ts)에서 조회.
 * 앱 곳곳의 인라인 배지 스팬 중복(20+ 파일, UX 감사)을 대체한다. 색·라벨 무변경(AA 동결).
 * 서버 안전(표현 전용, 'use client' 없음).
 */
export type StatusKind =
  | 'request'
  | 'deal'
  | 'order'
  | 'invitation'
  | 'matching'
  | 'dispute'
  | 'provider'
  | 'package'
  | 'member'

const MAPS: Record<StatusKind, readonly [Record<string, string>, Record<string, string>]> = {
  request: [REQUEST_STATUS_LABELS, REQUEST_STATUS_BADGE_CLASSES],
  deal: [DEAL_STATUS_LABELS, DEAL_STATUS_BADGE_CLASSES],
  order: [ORDER_STATUS_LABELS, ORDER_STATUS_BADGE_CLASSES],
  invitation: [INVITATION_STATUS_LABELS, INVITATION_STATUS_BADGE_CLASSES],
  matching: [MATCHING_STATUS_LABELS, MATCHING_STATUS_BADGE_CLASSES],
  dispute: [DISPUTE_STATUS_LABELS, DISPUTE_STATUS_BADGE_CLASSES],
  provider: [PROVIDER_STATUS_LABELS, PROVIDER_STATUS_BADGE_CLASSES],
  package: [PACKAGE_STATUS_LABELS, PACKAGE_STATUS_BADGE_CLASSES],
  member: [MEMBER_STATUS_LABELS, MEMBER_STATUS_BADGE_CLASSES],
}

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  kind: StatusKind
  status: string
}

export function StatusBadge({ kind, status, className, ...props }: StatusBadgeProps) {
  const [labels, classes] = MAPS[kind]
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium',
        classes[status] ?? 'bg-surface text-text-subtle',
        className,
      )}
      {...props}
    >
      {labels[status] ?? status}
    </span>
  )
}
