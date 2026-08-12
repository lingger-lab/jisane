import * as React from 'react'
import { cn } from '../../lib/cn'

/**
 * 스켈레톤 프리미티브 (설계 docs/16 §12 — 빈/로딩 상태를 최종 레이아웃에 맞춰 표시).
 * 서버 안전. prefers-reduced-motion은 animate-pulse가 Tailwind 기본으로 존중.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-[var(--radius-md)] bg-surface', className)}
      {...props}
    />
  )
}
