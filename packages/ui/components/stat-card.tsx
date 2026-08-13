import * as React from 'react'
import Link from 'next/link'
import { cn } from '../lib/cn'
import { AnimatedCounter } from './animated-counter'

export interface StatCardProps {
  value?: React.ReactNode
  /** 숫자면 뷰포트 진입 시 0→값 카운트업(AnimatedCounter). 미지정 시 value를 정적 표시. */
  countTo?: number
  suffix?: string
  label: string
  /** 있으면 클릭 가능한 타일(Link), 없으면 정적 타일. */
  href?: string
  accent?: 'primary' | 'accent'
  /** 주력 지표 강조 — raised(shadow-md)+포컬 보더+큰 수치. 그리드에 위계 부여(A5). */
  emphasis?: boolean
  className?: string
}

/**
 * 통계 타일 — 큰 수치(tabular-nums) + 라벨. 대시보드/현황 요약에 반복되던 손코딩 타일 통합.
 * 서피스는 surface-warm 고정(정렬 일관), 색은 primary/accent 선택. 서버 안전.
 * countTo가 숫자면 카운트업 애니메이션(reduced-motion 시 즉시 값).
 * emphasis면 raised+포컬 처리로 균일 그리드에 포컬(위계)을 만든다.
 */
export function StatCard({ value, countTo, suffix = '', label, href, accent = 'primary', emphasis = false, className }: StatCardProps) {
  const color = accent === 'accent' ? 'text-accent' : 'text-primary'
  const hover = accent === 'accent' ? 'hover:border-accent/30' : 'hover:border-primary/30'
  const focalBorder = accent === 'accent' ? 'border-accent/25' : 'border-primary/25'
  const base = cn(
    'rounded-xl border bg-surface-warm p-4 text-center',
    emphasis ? cn('shadow-md', focalBorder) : 'border-border-light shadow-xs',
  )
  const valueClass = cn(emphasis ? 'text-3xl' : 'text-2xl', 'font-bold tabular-nums', color)
  const inner = (
    <>
      {typeof countTo === 'number' ? (
        <AnimatedCounter end={countTo} suffix={suffix} className={cn('block', valueClass)} />
      ) : (
        <p className={valueClass}>{value}</p>
      )}
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
