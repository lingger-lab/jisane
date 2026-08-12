import * as React from 'react'
import Link from 'next/link'
import { cn } from '../lib/cn'

export interface EmptyStateProps {
  message: string
  /** 선택적 다음 행동 — 빈 상태는 막다른 길이 아니어야 한다(UX). */
  action?: { href: string; label: string }
  className?: string
}

/**
 * 빈 상태 — 데이터 없음 안내 + 선택적 다음 행동. 대시보드·마이페이지에 반복되던
 * 점선 박스 블록을 단일 소스로 통합(마크업 무변경). 서버 안전.
 */
export function EmptyState({ message, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center',
        className,
      )}
    >
      <p className="text-sm text-text-muted">{message}</p>
      {action && (
        <Link href={action.href} className="text-sm font-medium text-primary hover:underline">
          {action.label}
        </Link>
      )}
    </div>
  )
}
