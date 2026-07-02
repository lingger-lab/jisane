'use client'

import { useState } from 'react'
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
      <h2 className="text-lg font-bold text-text">어떤 분야의 전문가가 필요하세요?</h2>
      {newRequestsThisMonth > 0 && (
        <p className="mt-1 text-sm text-text-muted">
          이번 달 새 의뢰 <span className="font-semibold text-primary">{newRequestsThisMonth}건</span>
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
                ? 'bg-primary text-white'
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
          <div
            key={mid.id}
            className="rounded-xl border border-border-light bg-white p-3 shadow-xs"
          >
            <p className="text-sm font-medium text-text">{mid.label}</p>
            {mid.count > 0 ? (
              <p className="mt-1 text-xs text-primary font-medium">전문가 {mid.count}명</p>
            ) : (
              <span className="mt-1 inline-block rounded-full bg-surface px-2 py-0.5 text-[10px] text-text-subtle">
                모집 중
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
