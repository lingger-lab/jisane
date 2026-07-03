'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  interestedIds: string[]
  isAuthenticated: boolean
  isPartner: boolean
}

export function RequestList({
  requests,
  categoryTree,
  selectedCategory,
  interestedIds,
  isAuthenticated,
  isPartner,
}: RequestListProps) {
  const router = useRouter()
  const [interested, setInterested] = useState<Set<string>>(new Set(interestedIds))
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
    if (categoryId) {
      router.push(`/requests?category=${categoryId}`)
    } else {
      router.push('/requests')
    }
  }

  async function handleInterest(requestId: string) {
    if (!isAuthenticated || !isPartner) return
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
      {/* 헤더 */}
      <div className="mb-4 flex items-center gap-2">
        <Link href="/" className="text-sm text-text-muted hover:text-text transition-colors">
          &larr; 홈
        </Link>
      </div>
      <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-text">열린 의뢰 탐색</h1>
      <p className="mt-1 text-sm text-text-muted">
        {requests.length > 0
          ? `${requests.length}건의 열린 의뢰`
          : '카테고리별로 의뢰를 찾아보세요'}
      </p>

      {/* 대분류 탭 */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleCategoryChange(null)}
          className={`rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-accent text-white'
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
                  ? 'bg-accent text-white'
                  : 'bg-surface text-text-muted hover:bg-surface-warm'
              }`}
            >
              {major.label}
            </button>
          )
        })}
      </div>

      {/* 중분류 칩 (대분류 선택 시) */}
      {selectedMajorIdx >= 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {categoryTree[selectedMajorIdx].midCategories.map((mid) => (
            <button
              key={mid.id}
              type="button"
              onClick={() => handleCategoryChange(mid.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedCategory === mid.id
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'bg-surface text-text-subtle hover:bg-surface-warm'
              }`}
            >
              {mid.label}
            </button>
          ))}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && <p className="mt-3 text-xs text-error">{error}</p>}

      {/* 의뢰 리스트 */}
      <div className="mt-4 flex flex-col gap-3">
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">
              {selectedCategory
                ? '현재 이 분야의 열린 의뢰가 없습니다.'
                : '현재 열린 의뢰가 없습니다.'}
            </p>
            {selectedCategory && (
              <button
                type="button"
                onClick={() => handleCategoryChange(null)}
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
                  {isAuthenticated && isPartner ? (
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
                      {isAuthenticated ? '전문가 등록 후 관심 표현' : '로그인 후 관심 표현'}
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
