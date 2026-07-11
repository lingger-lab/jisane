'use client'

import { useState, useEffect } from 'react'
import { getCandidatesForRequest, createMatching, generateAiCandidates, selectCandidate } from '@/lib/admin/actions'

interface RequestItem {
  id: string
  title: string
  detail: string
  req_type: string | null
  budget_hope: number | null
  created_at: string
  client: {
    company: string | null
    ceo_name: string | null
    email: string
    contact: string | null
  }
}

interface Candidate {
  partner_id: string
  name: string | null
  field: string | null
  career_yrs: number | null
  score: number
  score_detail: Record<string, number> | null
  rank: number
  status: string
  auto_assign_at: string | null
  interested: boolean
  interest_note: string | null
}

const RANK_BADGE = ['', '1순위', '2순위', '3순위'] as const

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function update() {
      const diff = new Date(targetDate).getTime() - Date.now()
      if (diff <= 0) {
        setRemaining('자동 배정 시간 초과')
        return
      }
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      setRemaining(`자동배정까지 ${hours}시간 ${mins}분`)
    }
    update()
    const interval = setInterval(update, 60_000)
    return () => clearInterval(interval)
  }, [targetDate])

  return <span className="text-xs text-warning font-medium">{remaining}</span>
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
  const [hasAiCandidates, setHasAiCandidates] = useState(false)
  const [autoAssignAt, setAutoAssignAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [assignedId, setAssignedId] = useState<string | null>(null)

  async function handleShowCandidates(requestId: string) {
    if (expandedId === requestId) {
      setExpandedId(null)
      return
    }
    setLoading(true)
    setExpandedId(requestId)
    const result = await getCandidatesForRequest(requestId)
    setCandidates(result.candidates)
    setHasAiCandidates(result.hasAiCandidates ?? false)
    setAutoAssignAt((result as { autoAssignAt?: string }).autoAssignAt ?? null)
    setLoading(false)
  }

  async function handleGenerateAi(requestId: string) {
    setGenerating(true)
    setActionError(null)
    const result = await generateAiCandidates(requestId)
    if (result.error) {
      setActionError(result.error)
    } else {
      // 새로 생성된 후보 로드
      const res = await getCandidatesForRequest(requestId)
      setCandidates(res.candidates)
      setHasAiCandidates(res.hasAiCandidates ?? false)
      setAutoAssignAt((res as { autoAssignAt?: string }).autoAssignAt ?? null)
    }
    setGenerating(false)
  }

  async function handleAssign(requestId: string, partnerId: string) {
    setActionError(null)
    const action = hasAiCandidates ? selectCandidate : createMatching
    const result = await action(requestId, partnerId)
    if (result.error) {
      setActionError(result.error)
    } else {
      setAssignedId(requestId)
      setTimeout(() => setAssignedId(null), 3000)
    }
  }

  if (requests.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">매칭 대기 중인 의뢰가 없습니다.</p>
  }

  const visibleRequests = requests.filter((r) => r.id !== assignedId)

  return (
    <div className="flex flex-col gap-3">
      {actionError && <p className="text-xs text-error">{actionError}</p>}
      {assignedId && (
        <div className="rounded-lg bg-success-light border border-success/20 p-3 text-sm text-success font-medium animate-fade-in">
          매칭이 생성되었습니다. &ldquo;매칭 진행&rdquo; 탭에서 확인하세요.
        </div>
      )}
      {visibleRequests.map((req) => (
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
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-subtle">
                {req.client.company && <span className="font-medium text-text-muted">{req.client.company}</span>}
                {req.client.ceo_name && <span>{req.client.ceo_name}</span>}
                {req.client.contact && (
                  <a href={`tel:${req.client.contact}`} className="hover:text-accent transition-colors">{req.client.contact}</a>
                )}
                <a href={`mailto:${req.client.email}`} className="hover:text-accent transition-colors">{req.client.email}</a>
              </div>
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
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className="text-sm text-text-muted">적합한 후보가 없습니다.</p>
                  <button
                    type="button"
                    onClick={() => handleGenerateAi(req.id)}
                    disabled={generating}
                    className="rounded-lg bg-info px-4 py-2 text-xs font-medium text-white hover:bg-info/90 disabled:opacity-50"
                  >
                    {generating ? 'AI 분석 중...' : 'AI 후보 추천'}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-muted">
                      {hasAiCandidates ? 'AI 추천 후보' : '추천 후보 (관심 표현 우선)'}
                    </p>
                    {!hasAiCandidates && (
                      <button
                        type="button"
                        onClick={() => handleGenerateAi(req.id)}
                        disabled={generating}
                        className="rounded-lg border border-info/30 bg-info/5 px-3 py-1 text-xs font-medium text-info hover:bg-info/10 disabled:opacity-50"
                      >
                        {generating ? 'AI 분석 중...' : 'AI 후보 확정'}
                      </button>
                    )}
                  </div>

                  {autoAssignAt && (
                    <div className="flex items-center gap-2 rounded-lg bg-warning/5 border border-warning/20 px-3 py-2">
                      <CountdownTimer targetDate={autoAssignAt} />
                    </div>
                  )}

                  {candidates.map((c) => (
                    <div
                      key={c.partner_id}
                      className={`flex flex-col gap-1 rounded-md p-3 ${
                        c.interested
                          ? 'bg-accent/5 border border-accent/20'
                          : hasAiCandidates && c.rank <= 3
                            ? 'bg-info/5 border border-info/20'
                            : 'bg-surface'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {hasAiCandidates && c.rank <= 3 && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${
                              c.rank === 1
                                ? 'bg-yellow-100 text-yellow-700'
                                : c.rank === 2
                                  ? 'bg-gray-100 text-gray-600'
                                  : 'bg-orange-100 text-orange-600'
                            }`}>
                              {RANK_BADGE[c.rank]}
                            </span>
                          )}
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
                        </div>
                        {c.status !== 'selected' && c.status !== 'skipped' && (
                          <button
                            type="button"
                            onClick={() => handleAssign(req.id, c.partner_id)}
                            className="rounded-lg bg-success px-3 py-1 text-xs font-medium text-white hover:bg-success/90"
                          >
                            {hasAiCandidates ? '이 후보로 매칭' : '배정'}
                          </button>
                        )}
                        {c.status === 'selected' && (
                          <span className="rounded-lg bg-success/10 px-3 py-1 text-xs font-medium text-success">선택됨</span>
                        )}
                        {c.status === 'skipped' && (
                          <span className="rounded-lg bg-surface px-3 py-1 text-xs font-medium text-text-subtle">미선택</span>
                        )}
                      </div>

                      {/* 점수 상세 */}
                      {c.score_detail && hasAiCandidates && (
                        <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-text-subtle">
                          {c.score_detail.category > 0 && <span>카테고리 +{c.score_detail.category}</span>}
                          {c.score_detail.keyword > 0 && <span>키워드 +{c.score_detail.keyword}</span>}
                          {c.score_detail.career > 0 && <span>경력 +{c.score_detail.career}</span>}
                          {c.score_detail.interest > 0 && <span>관심 +{c.score_detail.interest}</span>}
                          {c.score_detail.rating > 0 && <span>평점 +{c.score_detail.rating}</span>}
                          {c.score_detail.track > 0 && <span>실적 +{c.score_detail.track}</span>}
                        </div>
                      )}

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
