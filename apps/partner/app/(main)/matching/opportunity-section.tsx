'use client'

import { useState } from 'react'
import { expressInterest, withdrawInterest } from '@/lib/interest/actions'

interface OpenRequest {
  id: string
  title: string
  req_type: string | null
  budget_hope: number | null
  detail: string
  created_at: string
}

export function OpportunitySection({
  requests,
  interestedIds,
}: {
  requests: OpenRequest[]
  interestedIds: string[]
}) {
  const [interested, setInterested] = useState<Set<string>>(new Set(interestedIds))
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-light py-6 text-center">
        <p className="text-sm text-text-muted">현재 공개된 의뢰가 없습니다.</p>
        <p className="mt-1 text-xs text-text-subtle">새 의뢰가 등록되면 여기에 표시됩니다.</p>
      </div>
    )
  }

  async function handleInterest(requestId: string) {
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
    <div className="flex flex-col gap-3">
      {error && <p className="text-xs text-error">{error}</p>}
      {requests.map((req) => {
        const isInterested = interested.has(req.id)
        const isLoading = loading === req.id

        return (
          <div
            key={req.id}
            className="rounded-xl border border-border-light p-4 shadow-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-medium text-text">{req.title}</h3>
                <p className="mt-1 line-clamp-2 text-xs text-text-muted">{req.detail}</p>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-text-muted">
                  {req.req_type && (
                    <span className="rounded bg-surface px-2 py-0.5">{req.req_type}</span>
                  )}
                  {req.budget_hope && (
                    <span className="font-medium text-accent">
                      {req.budget_hope.toLocaleString('ko-KR')}원
                    </span>
                  )}
                  <span>{new Date(req.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
              </div>
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
                {isLoading
                  ? '...'
                  : isInterested
                    ? '관심 표현 완료'
                    : '관심 표현'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
