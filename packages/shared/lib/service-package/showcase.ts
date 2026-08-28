import { CATEGORY_LABELS, type ServicePackage, type ServiceCategory } from '../service-catalog'

/**
 * 공개 카탈로그 쇼케이스·필터 — 순수 함수(server-only 쿼리와 분리해 vitest 가능).
 */

/** 대표 N개 선정: featured 우선 → 최신(createdAt desc). 입력 불변. */
export function pickShowcase(pkgs: ServicePackage[], n: number): ServicePackage[] {
  return [...pkgs]
    .sort((a, b) => {
      const fa = a.featured ? 1 : 0
      const fb = b.featured ? 1 : 0
      if (fa !== fb) return fb - fa
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
    })
    .slice(0, n)
}

/** 검색어(q)·카테고리(cat) 필터. cat 'all'/미지정은 전체. 입력 불변. */
export function filterCatalog(
  pkgs: ServicePackage[],
  { q, cat }: { q?: string; cat?: ServiceCategory | 'all' },
): ServicePackage[] {
  const query = (q ?? '').trim().toLowerCase()
  return pkgs.filter((p) => {
    if (cat && cat !== 'all' && p.category !== cat) return false
    if (!query) return true
    const hay = [p.name, p.provider, p.description, p.valueDesc, CATEGORY_LABELS[p.category]]
      .join(' ')
      .toLowerCase()
    return hay.includes(query)
  })
}
