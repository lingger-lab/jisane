import * as React from 'react'
import Link from 'next/link'
import { cn } from '../lib/cn'

export interface StatCardProps {
  value: React.ReactNode
  label: string
  /** 있으면 클릭 가능한 타일(Link), 없으면 정적 타일. */
  href?: string
  accent?: 'primary' | 'accent'
  className?: string
}

/**
 * 통계 타일 — 큰 수치(tabular-nums) + 라벨. 대시보드/현황 요약에 반복되던 손코딩 타일 통합.
 * 서피스는 surface-warm 고정(정렬 일관), 색은 primary/accent 선택. 서버 안전.
 */
export function StatCard({ value, label, href, accent = 'primary', className }: StatCardProps) {
  const color = accent === 'accent' ? 'text-accent' : 'text-primary'
  const hover = accent === 'accent' ? 'hover:border-accent/30' : 'hover:border-primary/30'
  const base = 'rounded-xl border border-border-light bg-surface-warm p-4 text-center shadow-xs'
  const inner = (
    <>
      <p className={cn('text-2xl font-bold tabular-nums', color)}>{value}</p>
      <p className="mt-1 text-xs text-text-muted">{label}</p>
    </>
  )
  return href ? (
    <Link href={href} className={cn(base, 'transition-colors', hover, className)}>
      {inner}
    </Link>
  ) : (
    <div className={cn(base, className)}>{inner}</div>
  )
}
