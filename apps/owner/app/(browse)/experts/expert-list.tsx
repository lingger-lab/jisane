'use client'

import { useRouter } from 'next/navigation'
import { SearchBox } from '@jisane/ui/search-box'
import { ErrorState } from '@jisane/ui/error-state'
import { FilterRadioGroup } from '@jisane/ui/filter-radio-group'
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

interface CategoryChip {
  id: string
  label: string
}

interface ExpertListProps {
  experts: ExpertItem[]
  categoryTree: CategoryChip[]
  selectedCategory: string | null
  query: string
  /** 서버 쿼리 실패 — 빈 상태 대신 에러 상태를 렌더한다(검색 결과 없음과 구분, 감사 docs/11 P3-75). */
  loadFailed?: boolean
}

export function ExpertList({ experts, categoryTree, selectedCategory, query, loadFailed = false }: ExpertListProps) {
  const router = useRouter()

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
        {loadFailed
          ? '조회 중 문제가 발생했습니다'
          : query
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

      {/* 분류 필터 (평면 12) — expert 의뢰 탐색과 동일 패턴(FilterRadioGroup) */}
      <FilterRadioGroup
        options={[
          { value: '', label: '전체' },
          ...categoryTree.map((cat) => ({ value: cat.id, label: cat.label })),
        ]}
        value={selectedCategory ?? ''}
        onChange={(id) => handleCategoryChange(id || null)}
        label="분류 필터"
        className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6"
        optionClassName={(selected) =>
          `rounded-lg px-2 py-2 text-xs font-medium text-center leading-tight break-keep transition-colors ${
            selected
              ? 'bg-primary text-white'
              : 'bg-surface text-text-muted hover:bg-surface-warm'
          }`
        }
      />

      {/* 시니어지식인 리스트 — 조회 실패(에러)와 검색 결과 없음(빈)을 구분한다 */}
      <div className="mt-4 flex flex-col gap-3">
        {loadFailed ? (
          <ErrorState
            message={
              query
                ? '검색 결과를 불러오지 못했습니다.'
                : '시니어지식인 목록을 불러오지 못했습니다.'
            }
          />
        ) : experts.length === 0 ? (
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
          experts.map((expert, i) => (
            <ExpertCard
              key={expert.id}
              expert={expert}
              className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`}
            />
          ))
        )}
      </div>
    </div>
  )
}
