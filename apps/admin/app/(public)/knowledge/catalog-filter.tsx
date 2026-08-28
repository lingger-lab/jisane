'use client'

import { useRouter } from 'next/navigation'
import { FilterRadioGroup } from '@jisane/ui/filter-radio-group'
import { CATEGORY_ORDER, CATEGORY_LABELS } from '@jisane/shared/service-catalog'

/**
 * 공개 카탈로그 카테고리 필터 — URL(?cat=)이 진실원. 검색어(q)는 보존.
 * pillar=NULL 스킬도 커버하도록 category(3값) 축을 쓴다.
 */
const OPTIONS = [
  { value: 'all', label: '전체' },
  ...CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] })),
]

export function CatalogFilter({ cat, q }: { cat: string; q?: string }) {
  const router = useRouter()

  function onChange(value: string) {
    const params = new URLSearchParams()
    if (value && value !== 'all') params.set('cat', value)
    if (q) params.set('q', q)
    const qs = params.toString()
    router.push(qs ? `/knowledge?${qs}` : '/knowledge')
  }

  return (
    <FilterRadioGroup
      options={OPTIONS}
      value={cat || 'all'}
      onChange={onChange}
      label="카테고리"
      className="flex flex-wrap gap-2"
      optionClassName={(selected) =>
        `focus-ring rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
          selected ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-text'
        }`
      }
    />
  )
}
