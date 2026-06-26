'use client'

import { useState } from 'react'
import { getCandidatesForRequest, createMatching } from '@/lib/admin/actions'

interface RequestItem {
  id: string
  title: string
  detail: string
  req_type: string | null
  budget_hope: number | null
  created_at: string
}

interface Candidate {
  partner_id: string
  name: string | null
  field: string | null
  career_yrs: number | null
  score: number
  interested: boolean
  interest_note: string | null
}

export function MatchingTab({
  requests,
  interestCounts = {},
}: {
  requests: RequestItem[]
  interestCounts?: Record<string, number>
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleShowCandidates(requestId: string) {
    if (expandedId === requestId) {
      setExpandedId(null)
      return
    }
    setLoading(true)
    setExpandedId(requestId)
    const result = await getCandidatesForRequest(requestId)
    setCandidates(result.candidates)
    setLoading(false)
  }

  async function handleAssign(requestId: string, partnerId: string) {
    setActionError(null)
    const result = await createMatching(requestId, partnerId)
    if (result.error) {
      setActionError(result.error)
    }
  }

  if (requests.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">매칭 대기 중인 의뢰가 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {actionError && <p className="text-xs text-error">{actionError}</p>}
      {requests.map((req) => (
        <div key={req.id} className="rounded-lg border border-border p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-text">{req.title}</h3>
              <div className="mt-1 flex gap-2 text-xs text-text-muted">
                {req.req_type && <span className="rounded bg-surface px-2 py-0.5">{req.req_type}</span>}
                {req.budget_hope && (
                  <span>{req.budget_hope.toLocaleString('ko-KR')}원</span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-text-muted">{req.detail}</p>
              {(interestCounts[req.id] || 0) > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  관심 {interestCounts[req.id]}명
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleShowCandidates(req.id)}
              className="ml-3 shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:bg-accent/90"
            >
              {expandedId === req.id ? '닫기' : '후보 보기'}
            </button>
          </div>

          {expandedId === req.id && (
            <div className="mt-3 border-t border-border pt-3">
              {loading ? (
                <p className="text-sm text-text-muted">후보 검색 중...</p>
              ) : candidates.length === 0 ? (
                <p className="text-sm text-text-muted">적합한 후보가 없습니다.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-text-muted">추천 후보 (관심 표현 우선)</p>
                  {candidates.map((c) => (
                    <div
                      key={c.partner_id}
                      className={`flex flex-col gap-1 rounded-md p-3 ${
                        c.interested ? 'bg-accent/5 border border-accent/20' : 'bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium text-text">{c.name || '이름 미등록'}</span>
                          <span className="ml-2 text-xs text-text-muted">
                            {c.field} · {c.career_yrs || 0}년
                          </span>
                          {c.score > 0 && (
                            <span className="ml-2 rounded bg-info-light px-1.5 py-0.5 text-xs font-medium text-info">
                              {c.score}점
                            </span>
                          )}
                          {c.interested && (
                            <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">
                              관심 표현
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAssign(req.id, c.partner_id)}
                          className="rounded-lg bg-success px-3 py-1 text-xs font-medium text-white hover:bg-success/90"
                        >
                          배정
                        </button>
                      </div>
                      {c.interest_note && (
                        <p className="text-xs text-text-muted">
                          <span className="font-medium text-accent">메모:</span> {c.interest_note}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
