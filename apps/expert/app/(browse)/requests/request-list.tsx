'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SearchBox } from '@jisane/ui/search-box'
import { useSeededState } from '@jisane/ui/use-seeded-state'
import { FilterRadioGroup } from '@jisane/ui/filter-radio-group'
import { ErrorState } from '@jisane/ui/error-state'
import { expressInterest, withdrawInterest } from '@/lib/interest/actions'

interface RequestItem {
  id: string
  title: string
  detail: string
  reqType: string | null
  budgetHope: number | null
  categoryId: string | null
  createdAt: string
  company: string | null
}

interface MajorCategory {
  id: string
  label: string
  midCategories: { id: string; label: string }[]
}

interface RequestListProps {
  requests: RequestItem[]
  categoryTree: MajorCategory[]
  selectedCategory: string | null
  query: string
  interestedIds: string[]
  isAuthenticated: boolean
  isExpert: boolean
  /** 서버 쿼리 실패 — 빈 상태 대신 에러 상태를 렌더한다(검색 결과 없음과 구분, 감사 docs/11 P2-21). */
  loadFailed?: boolean
}

export function RequestList({
  requests,
  categoryTree,
  selectedCategory,
  query,
  interestedIds,
  isAuthenticated,
  isExpert,
  loadFailed = false,
}: RequestListProps) {
  const router = useRouter()
  // 서버 prop이 진실원 — revalidatePath('/requests') 후 새 interestedIds로 재동기화 (감사 P3-40)
  const [interested, setInterested] = useSeededState(interestedIds, (ids) => new Set(ids))
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 현재 선택된 대분류 찾기
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
    router.push(qs ? `/requests?${qs}` : '/requests')
  }

  async function handleInterest(requestId: string) {
    if (!isAuthenticated || !isExpert) return
    setLoading(requestId)
    setError(null)

    if (interested.has(requestId)) {
      const result = await withdrawInterest(requestId)
      if (result.error) {
        setError(result.error)
      } else {
        setInterested((prev) => {
          const next = new Set(prev)
          next.delete(requestId)
          return next
        })
      }
    } else {
      const result = await expressInterest(requestId)
      if (result.error) {
        setError(result.error)
      } else {
        setInterested((prev) => new Set(prev).add(requestId))
      }
    }
    setLoading(null)
  }

  return (
    <div>
      {/* 결과 요약 */}
      <p className="text-sm text-text-muted">
        {loadFailed
          ? '조회 중 문제가 발생했습니다'
          : query
            ? `"${query}" 검색 결과 ${requests.length}건`
            : requests.length > 0
              ? `${requests.length}건의 열린 의뢰`
              : '카테고리별로 의뢰를 찾아보세요'}
      </p>

      {/* 검색 (제목·내용) — 카테고리 필터 보존 */}
      <div className="mt-4">
        <SearchBox
          target="/requests"
          placeholder="제목·내용으로 열린 의뢰 검색"
          defaultValue={query}
          extraParams={selectedCategory ? { category: selectedCategory } : {}}
          colorToken="accent"
        />
      </div>

      {/* 대분류 탭 — 선택이 URL 내비게이션을 유발하므로 화살표는 포커스만 이동(수동 활성화) */}
      <FilterRadioGroup
        options={[
          { value: '', label: '전체' },
          ...categoryTree.map((major) => ({ value: major.id, label: major.label })),
        ]}
        value={
          !selectedCategory ? '' : selectedMajorIdx >= 0 ? categoryTree[selectedMajorIdx].id : null
        }
        onChange={(id) => handleCategoryChange(id || null)}
        label="대분류 필터"
        className="mt-4 flex flex-wrap gap-2"
        optionClassName={(selected) =>
          `rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            selected
              ? 'bg-accent text-white'
              : 'bg-surface text-text-muted hover:bg-surface-warm'
          }`
        }
      />

      {/* 중분류 칩 (대분류 선택 시) */}
      {selectedMajorIdx >= 0 && (
        <FilterRadioGroup
          options={categoryTree[selectedMajorIdx].midCategories.map((mid) => ({
            value: mid.id,
            label: mid.label,
          }))}
          value={selectedCategory}
          onChange={handleCategoryChange}
          label="중분류 필터"
          className="mt-2 flex flex-wrap gap-1"
          optionClassName={(selected) =>
            `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selected
                ? 'bg-accent/15 text-accent border border-accent/30'
                : 'bg-surface text-text-subtle hover:bg-surface-warm'
            }`
          }
        />
      )}

      {/* 에러 메시지 */}
      {error && <p className="mt-3 text-xs text-error" role="alert" aria-live="polite">{error}</p>}

      {/* 의뢰 리스트 — 조회 실패(에러)와 검색 결과 없음(빈)을 구분한다 */}
      <div className="mt-4 flex flex-col gap-3">
        {loadFailed ? (
          <ErrorState
            message={
              query ? '검색 결과를 불러오지 못했습니다.' : '의뢰 목록을 불러오지 못했습니다.'
            }
          />
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">
              {query
                ? `"${query}"에 맞는 열린 의뢰가 없습니다.`
                : selectedCategory
                  ? '현재 이 분야의 열린 의뢰가 없습니다.'
                  : '현재 열린 의뢰가 없습니다.'}
            </p>
            {(selectedCategory || query) && (
              <button
                type="button"
                onClick={() => { router.push('/requests') }}
                className="mt-2 text-xs text-accent hover:underline"
              >
                전체 의뢰 보기
              </button>
            )}
          </div>
        ) : (
          requests.map((req, i) => {
            const isInterested = interested.has(req.id)
            const isLoading = loading === req.id

            return (
              <div
                key={req.id}
                className={`rounded-xl border border-border-light p-4 md:p-5 shadow-xs animate-fade-in stagger-${Math.min(i + 1, 5)}`}
              >
                <Link href={`/requests/${req.id}`} className="block">
                  <h3 className="truncate font-medium text-text">{req.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-text-muted">{req.detail}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                    {req.reqType && (
                      <span className="rounded bg-accent/10 px-2 py-0.5 font-medium text-accent">
                        {req.reqType}
                      </span>
                    )}
                    {req.budgetHope && (
                      <span className="font-medium text-accent">
                        {req.budgetHope.toLocaleString('ko-KR')}원
                      </span>
                    )}
                    {req.company && (
                      <span>{req.company}</span>
                    )}
                    <span>{new Date(req.createdAt).toLocaleDateString('ko-KR')}</span>
                  </div>
                </Link>

                {/* 관심 표현 버튼 */}
                <div className="mt-3 flex justify-end">
                  {isAuthenticated && isExpert ? (
                    <button
                      type="button"
                      onClick={() => handleInterest(req.id)}
                      disabled={isLoading}
                      className={`shrink-0 rounded-xl px-3 py-2 text-xs font-medium transition-all disabled:opacity-50 ${
                        isInterested
                          ? 'border border-accent/30 bg-accent/5 text-accent'
                          : 'bg-accent text-white hover:bg-accent/90'
                      }`}
                    >
                      {isLoading ? '...' : isInterested ? '관심 표현 완료' : '관심 표현'}
                    </button>
                  ) : (
                    <Link
                      href="/"
                      className="rounded-xl bg-surface px-3 py-2 text-xs font-medium text-text-muted hover:bg-surface-warm transition-colors"
                    >
                      {isAuthenticated ? '시니어지식인 등록 후 관심 표현' : '로그인 후 관심 표현'}
                    </Link>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
