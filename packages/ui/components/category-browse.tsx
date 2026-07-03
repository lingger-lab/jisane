'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CategoryCount } from '@jisane/shared/landing-stats'

interface CategoryBrowseProps {
  categoryCounts: CategoryCount[]
  newRequestsThisMonth: number
  title: string
  countLabel: string
  countUnit: string
  colorToken: 'primary' | 'accent'
  baseHref: string
}

const colorMap = {
  primary: {
    text: 'text-primary',
    bg: 'bg-primary',
    bgLight: 'bg-primary/10',
  },
  accent: {
    text: 'text-accent',
    bg: 'bg-accent',
    bgLight: 'bg-accent/10',
  },
} as const

export function CategoryBrowse({
  categoryCounts,
  newRequestsThisMonth,
  title,
  countLabel,
  countUnit,
  colorToken,
  baseHref,
}: CategoryBrowseProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)
  const colors = colorMap[colorToken]

  const current = categoryCounts[selectedIdx]
  const sortedMid = [...(current?.midCategories ?? [])].sort((a, b) => b.count - a.count)

  return (
    <section className="w-full">
      <h2 className="text-lg md:text-xl font-bold text-text">{title}</h2>
      {newRequestsThisMonth > 0 && (
        <p className="mt-1 text-sm text-text-muted">
          이번 달 새 의뢰 <span className={`font-semibold ${colors.text}`}>{newRequestsThisMonth}건</span>
        </p>
      )}

      {/* 대분류 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        {categoryCounts.map((cat, idx) => (
          <button
            key={cat.majorId}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
              selectedIdx === idx
                ? `${colors.bg} text-white`
                : 'bg-surface text-text-muted hover:bg-surface-warm'
            }`}
          >
            {cat.majorLabel}
          </button>
        ))}
      </div>

      {/* 중분류 카드 */}
      <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {sortedMid.map((mid) => (
          <Link
            key={mid.id}
            href={`${baseHref}?category=${mid.id}`}
            className="rounded-xl border border-border-light bg-white p-4 md:p-5 shadow-xs card-hover block"
          >
            <p className="text-sm font-medium text-text">{mid.label}</p>
            {mid.count > 0 ? (
              <p className={`mt-1 text-xs ${colors.text} font-medium`}>
                {countLabel} {mid.count}{countUnit}
              </p>
            ) : (
              <span className="mt-1 inline-block rounded-full bg-surface px-2.5 py-1 text-xs text-text-subtle">
                모집 중
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
