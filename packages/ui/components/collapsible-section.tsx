'use client'

import { useId, useState } from 'react'

/** 랜딩 섹션용 접이식 컨테이너 — 제목을 클릭하면 목록이 펼쳐진다 */
export function CollapsibleSection({
  title,
  subtitle,
  hint = '펼쳐보기',
  defaultOpen = false,
  children,
}: {
  title: string
  subtitle?: string
  hint?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 rounded-xl border border-border-light bg-card p-4 md:p-5 text-left shadow-xs transition-all hover:border-primary/30 hover:shadow-sm focus-ring"
      >
        <div className="min-w-0">
          <span className="block text-xl md:text-2xl font-bold text-text">{title}</span>
          {subtitle && (
            <span className="mt-1 block text-sm md:text-base text-text-muted">{subtitle}</span>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-1.5 text-sm font-medium text-text-muted">
          {!open && <span className="hidden md:inline">{hint}</span>}
          <svg
            className={`h-5 w-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 8l5 5 5-5" />
          </svg>
        </span>
      </button>

      {open && (
        <div id={contentId} className="mt-4 animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}
