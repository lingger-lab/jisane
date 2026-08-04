'use client'

import { useRouter } from 'next/navigation'
import { SearchBox } from '@jisane/ui/search-box'
import { ExpertCard } from './expert-card'

interface ExpertItem {
  id: string
  name: string | null
  field: string | null
  careerYears: number | null
  grade: string
  totalScore: number | null
  reviewScore: number | null
  completionScore: number | null
  activityPoints: number
  categories: string[]
}

interface MajorCategory {
  id: string
  label: string
  midCategories: { id: string; label: string }[]
}

interface ExpertListProps {
  experts: ExpertItem[]
  categoryTree: MajorCategory[]
  selectedCategory: string | null
  query: string
}

export function ExpertList({ experts, categoryTree, selectedCategory, query }: ExpertListProps) {
  const router = useRouter()

  const selectedMajorIdx = selectedCategory
    ? categoryTree.findIndex(
        (m) =>
          m.id === selectedCategory ||
          m.midCategories.some((mid) => mid.id === selectedCategory)
      )
    : -1

  function handleCategoryChange(categoryId: string | null) {
    const params = new URLSearchParams()
    if (categoryId) params.set('category', categoryId)
    if (query) params.set('q', query)
    const qs = params.toString()
    router.push(qs ? `/experts?${qs}` : '/experts')
  }

  return (
    <div>
      <p className="mb-3 text-sm text-text-muted">
        {query
          ? `"${query}" 검색 결과 ${experts.length}명`
          : experts.length > 0
            ? `${experts.length}명의 활동 시니어지식인`
            : '카테고리별로 시니어지식인을 찾아보세요'}
      </p>

      {/* 검색 (이름·분야) — 카테고리 필터 보존 */}
      <div className="mt-4">
        <SearchBox
          target="/experts"
          placeholder="이름·분야로 시니어지식인 검색"
          defaultValue={query}
          extraParams={selectedCategory ? { category: selectedCategory } : {}}
        />
      </div>

      {/* 대분류 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleCategoryChange(null)}
          className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-primary text-white'
              : 'bg-surface text-text-muted hover:bg-surface-warm'
          }`}
        >
          전체
        </button>
        {categoryTree.map((major) => {
          const isActive =
            major.id === selectedCategory ||
            major.midCategories.some((m) => m.id === selectedCategory)
          return (
            <button
              key={major.id}
              type="button"
              onClick={() => handleCategoryChange(major.id)}
              className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text-muted hover:bg-surface-warm'
              }`}
            >
              {major.label}
            </button>
          )
        })}
      </div>

      {/* 중분류 칩 */}
      {selectedMajorIdx >= 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {categoryTree[selectedMajorIdx].midCategories.map((mid) => (
            <button
              key={mid.id}
              type="button"
              onClick={() => handleCategoryChange(mid.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === mid.id
                  ? 'bg-primary/15 text-primary border border-primary/30'
                  : 'bg-surface text-text-subtle hover:bg-surface-warm'
              }`}
            >
              {mid.label}
            </button>
          ))}
        </div>
      )}

      {/* 시니어지식인 리스트 */}
      <div className="mt-4 flex flex-col gap-3">
        {experts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">
              {query
                ? `"${query}"에 맞는 시니어지식인이 없습니다.`
                : selectedCategory
                  ? '현재 이 분야의 활동 시니어지식인이 없습니다.'
                  : '현재 활동 시니어지식인이 없습니다.'}
            </p>
            {(selectedCategory || query) && (
              <button
                type="button"
                onClick={() => { router.push('/experts') }}
                className="mt-2 text-xs text-primary hover:underline"
              >
                전체 시니어지식인 보기
              </button>
            )}
          </div>
        ) : (
          experts.map((expert) => <ExpertCard key={expert.id} expert={expert} />)
        )}
      </div>
    </div>
  )
}
