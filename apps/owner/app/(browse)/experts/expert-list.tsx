'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface ExpertItem {
  id: string
  name: string | null
  field: string | null
  careerYrs: number | null
  grade: string
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
}

const GRADE_LABEL: Record<string, string> = {
  veteran: '베테랑',
  standard: '전문가',
  new: '신규',
}

export function ExpertList({ experts, categoryTree, selectedCategory }: ExpertListProps) {
  const router = useRouter()

  const selectedMajorIdx = selectedCategory
    ? categoryTree.findIndex(
        (m) =>
          m.id === selectedCategory ||
          m.midCategories.some((mid) => mid.id === selectedCategory)
      )
    : -1

  function handleCategoryChange(categoryId: string | null) {
    if (categoryId) {
      router.push(`/experts?category=${categoryId}`)
    } else {
      router.push('/experts')
    }
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-2">
        <Link href="/" className="text-sm text-text-muted hover:text-text transition-colors">
          &larr; 홈
        </Link>
      </div>
      <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-text">분야별 전문가</h1>
      <p className="mt-1 text-sm text-text-muted">
        {experts.length > 0
          ? `${experts.length}명의 활동 전문가`
          : '카테고리별로 전문가를 찾아보세요'}
      </p>

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

      {/* 전문가 리스트 */}
      <div className="mt-4 flex flex-col gap-3">
        {experts.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">
              {selectedCategory
                ? '현재 이 분야의 활동 전문가가 없습니다.'
                : '현재 활동 전문가가 없습니다.'}
            </p>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => handleCategoryChange(null)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                전체 전문가 보기
              </button>
            )}
          </div>
        ) : (
          experts.map((expert, i) => (
            <Link
              key={expert.id}
              href={`/experts/${expert.id}`}
              className={`rounded-xl border border-border-light p-4 md:p-5 shadow-xs card-hover block animate-fade-in stagger-${Math.min(i + 1, 5)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-text">{expert.name ?? '전문가'}</h3>
                  {expert.field && (
                    <p className="mt-0.5 text-xs text-text-muted">{expert.field}</p>
                  )}
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    expert.grade === 'veteran'
                      ? 'bg-primary/10 text-primary'
                      : expert.grade === 'new'
                        ? 'bg-surface text-text-subtle'
                        : 'bg-primary/5 text-primary/80'
                  }`}
                >
                  {GRADE_LABEL[expert.grade] ?? expert.grade}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                {expert.careerYrs && (
                  <span className="font-medium text-primary">경력 {expert.careerYrs}년</span>
                )}
                {expert.categories.length > 0 && (
                  <span className="truncate">{expert.categories.slice(0, 3).join(' · ')}</span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
