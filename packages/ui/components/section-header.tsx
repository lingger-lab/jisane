import * as React from 'react'
import { cn } from '../lib/cn'

/**
 * 섹션 헤더 — 번호 세리프 칩 + 제목 + 부제. 이 제품의 시그니처 레이아웃 장치를 단일 소스로.
 * (owner/expert 랜딩에 손코딩되어 있던 패턴 추출 — 설계 리뷰 §엣지 4.) 서버 안전.
 */
const TONE: Record<string, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  partner: 'bg-partner-solid',
}

export function SectionHeader({
  num,
  title,
  subtitle,
  tone = 'primary',
  sticky = false,
  className,
}: {
  num: React.ReactNode
  title: string
  subtitle?: string
  tone?: 'primary' | 'accent' | 'partner'
  /** true면 스크롤 시 앱헤더(top-14) 아래 고정 — 콘텐츠가 밑으로 슬라이드(랜딩 리듬감). */
  sticky?: boolean
  className?: string
}) {
  return (
    <header
      className={cn(
        'flex items-start gap-3',
        sticky
          ? 'section-sticky sticky top-14 z-20 mb-5 -mx-4 bg-background/85 px-4 py-2.5 backdrop-blur-sm md:-mx-6 md:px-6'
          : 'mb-5',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif text-base font-bold text-white',
          TONE[tone],
        )}
        aria-hidden="true"
      >
        {num}
      </span>
      <div>
        <h2 className="font-serif text-xl font-bold leading-tight text-text md:text-2xl">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-text-muted">{subtitle}</p>}
      </div>
    </header>
  )
}
