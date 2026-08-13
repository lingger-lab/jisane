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
  primary: 'text-primary',
  accent: 'text-accent',
} as const

/**
 * 평면 12분류 탐색 — 분류 카드 그리드(라벨 + 수). 각 카드는 baseHref?category=id로 이동.
 * 이전 대분류탭→중분류 드릴다운은 폐기(v3 평면화). 서버 안전(표현 전용).
 */
export function CategoryBrowse({
  categoryCounts,
  newRequestsThisMonth,
  title,
  countLabel,
  countUnit,
  colorToken,
  baseHref,
}: CategoryBrowseProps) {
  const accentText = colorMap[colorToken]

  return (
    <section className="w-full">
      <h2 className="text-lg md:text-xl font-bold font-serif text-text">{title}</h2>
      {newRequestsThisMonth > 0 && (
        <p className="mt-1 text-sm text-text-muted">
          이번 달 새 의뢰 <span className={`font-semibold ${accentText}`}>{newRequestsThisMonth}건</span>
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 md:gap-3">
        {categoryCounts.map((cat, i) => (
          <Link
            key={cat.id}
            href={`${baseHref}?category=${cat.id}`}
            className={`block rounded-xl border border-border-light bg-card p-4 sm:p-3.5 text-center shadow-xs card-hover animate-appear stagger-${Math.min(i + 1, 5)}`}
          >
            {/* 옆 섹션 툴 카드와 동일 텍스트 규격 — 제목 text-base(16) semibold · 보조 text-sm(14).
                6칸에서도 다운스텝하지 않아 페이지 내 카드 간 위계가 일치한다. */}
            <p className="text-base font-semibold leading-tight break-keep text-text">{cat.label}</p>
            {cat.count > 0 ? (
              <p className={`mt-1 text-sm font-medium tabular-nums ${accentText}`}>
                {countLabel} {cat.count}{countUnit}
              </p>
            ) : (
              <p className="mt-1 text-sm text-text-subtle">모집 중</p>
            )}
          </Link>
        ))}
      </div>
    </section>
  )
}
