'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { CategoryCount } from '@jisane/shared/landing-stats'

interface CategoryBrowseProps {
  categoryCounts: CategoryCount[]
  newRequestsThisMonth: number
}

export function CategoryBrowse({ categoryCounts, newRequestsThisMonth }: CategoryBrowseProps) {
  const [selectedIdx, setSelectedIdx] = useState(0)

  const current = categoryCounts[selectedIdx]
  // 활동 분야(count > 0) 우선 정렬
  const sortedMid = [...(current?.midCategories ?? [])].sort((a, b) => b.count - a.count)

  return (
    <section className="w-full">
      <h2 className="text-lg font-bold text-text">어떤 분야의 의뢰가 있나요?</h2>
      {newRequestsThisMonth > 0 && (
        <p className="mt-1 text-sm text-text-muted">
          이번 달 새 의뢰 <span className="font-semibold text-accent">{newRequestsThisMonth}건</span>
        </p>
      )}

      {/* 대분류 탭 */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {categoryCounts.map((cat, idx) => (
          <button
            key={cat.majorId}
            type="button"
            onClick={() => setSelectedIdx(idx)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedIdx === idx
                ? 'bg-accent text-white'
                : 'bg-surface text-text-muted hover:bg-surface-warm'
            }`}
          >
            {cat.majorLabel}
          </button>
        ))}
      </div>

      {/* 중분류 카드 */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {sortedMid.map((mid) => (
          <Link
            key={mid.id}
            href={`/requests?category=${mid.id}`}
            className="rounded-xl border border-border-light bg-white p-3 shadow-xs card-hover block"
          >
            <p className="text-sm font-medium text-text">{mid.label}</p>
            {mid.count > 0 ? (
              <p className="mt-1 text-xs text-accent font-medium">의뢰 {mid.count}건</p>
            ) : (
              <span className="mt-1 inline-block rounded-full bg-surface px-2 py-0.5 text-[10px] text-text-subtle">
                모집 중
              </span>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
