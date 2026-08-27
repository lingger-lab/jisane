'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, Sparkles, Clock, X } from 'lucide-react'
import { Card } from '@jisane/ui/card'
import { Button } from '@jisane/ui/button'
import { Skeleton } from '@jisane/ui/skeleton'
import { getCandidatesForRequest, createMatching, generateAiCandidates, selectCandidate } from '@/lib/admin/actions'

interface RequestItem {
  id: string
  title: string
  detail: string
  req_type: string | null
  budget_hope: number | null
  created_at: string
  owner: {
    company: string | null
    ceo_name: string | null
    email: string
    contact: string | null
  }
}

interface Candidate {
  expert_id: string
  name: string | null
  field: string | null
  career_years: number | null
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

  return <span className="text-xs font-medium text-warning">{remaining}</span>
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
  const [assigningExpertId, setAssigningExpertId] = useState<string | null>(null)
  // 후보 fetch 시퀀스 토큰 — 연타로 다른 의뢰를 펼쳤을 때 이전 요청의 늦은 응답이
  // 최신 패널의 후보 목록을 덮어쓰지 않게 최신 요청만 반영한다(감사 docs/11 P2-1).
  const candidateSeqRef = useRef(0)

  async function loadCandidates(requestId: string) {
    const seq = ++candidateSeqRef.current
    const result = await getCandidatesForRequest(requestId)
    if (seq !== candidateSeqRef.current) return // 이미 다른 의뢰로 전환됨 — stale 응답 폐기
    setCandidates(result.candidates)
    setHasAiCandidates(result.hasAiCandidates ?? false)
    setAutoAssignAt((result as { autoAssignAt?: string }).autoAssignAt ?? null)
    setLoading(false)
  }

  async function handleShowCandidates(requestId: string) {
    if (expandedId === requestId) {
      candidateSeqRef.current++ // 진행 중인 fetch가 있으면 무효화
      setExpandedId(null)
      return
    }
    setLoading(true)
    setExpandedId(requestId)
    await loadCandidates(requestId)
  }

  async function handleGenerateAi(requestId: string) {
    setGenerating(true)
    setActionError(null)
    const result = await generateAiCandidates(requestId)
    if (result.error) {
      setActionError(result.error)
    } else {
      // 새로 생성된 후보 로드
      await loadCandidates(requestId)
    }
    setGenerating(false)
  }

  async function handleAssign(requestId: string, expertId: string) {
    if (assigningExpertId) return // in-flight 중 재클릭 무시 (감사 docs/10 P1-1)
    setActionError(null)
    setAssigningExpertId(expertId)
    try {
      const action = hasAiCandidates ? selectCandidate : createMatching
      const result = await action(requestId, expertId)
      if (result.error) {
        setActionError(result.error)
      } else {
        setAssignedId(requestId)
        setTimeout(() => setAssignedId(null), 3000)
      }
    } catch {
      setActionError('배정 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setAssigningExpertId(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-12 text-center">
        <Users className="mx-auto h-8 w-8 text-text-subtle" strokeWidth={1.75} aria-hidden="true" />
        <p className="text-sm text-text-muted">매칭 대기 중인 의뢰가 없습니다.</p>
      </div>
    )
  }

  const visibleRequests = requests.filter((r) => r.id !== assignedId)

  return (
    <div className="flex flex-col gap-3">
      {actionError && (
        <div className="flex items-center gap-2 rounded-lg border border-error/20 bg-error-light p-3">
          <p className="flex-1 text-xs text-error">{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError(null)}
            aria-label="오류 닫기"
            className="focus-ring shrink-0 rounded-md p-1 text-error/70 transition-colors hover:text-error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {assignedId && (
        <div className="animate-fade-in rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm font-medium text-primary">
          매칭이 생성되었습니다. &ldquo;매칭 진행&rdquo; 탭에서 확인하세요.
        </div>
      )}
      {visibleRequests.map((req) => (
        <Card key={req.id} className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-text">{req.title}</h3>
              <div className="mt-1 flex gap-2 text-xs text-text-muted">
                {req.req_type && <span className="rounded bg-surface px-2 py-0.5">{req.req_type}</span>}
                {req.budget_hope && <span className="tabular-nums">{req.budget_hope.toLocaleString('ko-KR')}원</span>}
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-text-muted">{req.detail}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-subtle">
                {req.owner.company && <span className="font-medium text-text-muted">{req.owner.company}</span>}
                {req.owner.ceo_name && <span>{req.owner.ceo_name}</span>}
                {req.owner.contact && (
                  <a href={`tel:${req.owner.contact}`} className="rounded px-1 py-0.5 transition-colors hover:bg-accent/5 hover:text-accent">{req.owner.contact}</a>
                )}
                <a href={`mailto:${req.owner.email}`} className="rounded px-1 py-0.5 transition-colors hover:bg-accent/5 hover:text-accent">{req.owner.email}</a>
              </div>
              {(interestCounts[req.id] || 0) > 0 && (
                <span className="mt-1 inline-flex items-center gap-1 rounded bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  관심 {interestCounts[req.id]}명
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" className="ml-3 shrink-0" onClick={() => handleShowCandidates(req.id)}>
              {expandedId === req.id ? '닫기' : '후보 보기'}
            </Button>
          </div>

          {expandedId === req.id && (
            <div className="mt-3 border-t border-border pt-3">
              {loading ? (
                <div className="flex flex-col gap-2" aria-label="후보 검색 중">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : candidates.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <p className="text-sm text-text-muted">적합한 후보가 없습니다.</p>
                  <Button variant="accent" size="sm" disabled={generating} onClick={() => handleGenerateAi(req.id)}>
                    <Sparkles className="h-3.5 w-3.5" /> {generating ? 'AI 분석 중…' : 'AI 후보 추천'}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-text-muted">
                      {hasAiCandidates ? 'AI 추천 후보' : '추천 후보 (관심 표현 우선)'}
                    </p>
                    {!hasAiCandidates && (
                      <Button variant="outline" size="sm" disabled={generating} onClick={() => handleGenerateAi(req.id)}>
                        <Sparkles className="h-3.5 w-3.5" /> {generating ? 'AI 분석 중…' : 'AI 후보 확정'}
                      </Button>
                    )}
                  </div>

                  {autoAssignAt && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-warning/20 bg-warning/5 px-3 py-2">
                      <Clock className="h-3.5 w-3.5 text-warning" />
                      <CountdownTimer targetDate={autoAssignAt} />
                    </div>
                  )}

                  {candidates.map((c) => (
                    <div
                      key={c.expert_id}
                      className={`flex flex-col gap-1 rounded-lg p-3 ${
                        c.interested ? 'border border-accent/20 bg-accent/5' : 'border border-border-light bg-surface-warm'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          {/* 순위는 무게+앰버로 — 1순위만 강조, 그 외 중립(감사 UX: 색 수렴) */}
                          {hasAiCandidates && c.rank <= 3 && (
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                              c.rank === 1 ? 'bg-accent/15 text-accent' : 'bg-surface text-text-muted'
                            }`}>
                              {RANK_BADGE[c.rank]}
                            </span>
                          )}
                          <div className="min-w-0">
                            <span className="font-medium text-text">{c.name || '이름 미등록'}</span>
                            <span className="ml-2 text-xs text-text-muted">{c.field} · {c.career_years || 0}년</span>
                            {c.score > 0 && (
                              <span className="ml-2 rounded bg-surface px-1.5 py-0.5 text-xs font-medium tabular-nums text-text-muted">{c.score}점</span>
                            )}
                            {c.interested && (
                              <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-xs font-medium text-accent">관심 표현</span>
                            )}
                          </div>
                        </div>
                        {c.status !== 'selected' && c.status !== 'skipped' && (
                          <Button variant="accent" size="sm" className="shrink-0" disabled={assigningExpertId !== null} onClick={() => handleAssign(req.id, c.expert_id)}>
                            {assigningExpertId === c.expert_id ? '배정 중…' : hasAiCandidates ? '이 후보로 매칭' : '배정'}
                          </Button>
                        )}
                        {c.status === 'selected' && (
                          <span className="shrink-0 rounded-lg bg-primary/10 px-3 py-1 text-xs font-medium text-primary">선택됨</span>
                        )}
                        {c.status === 'skipped' && (
                          <span className="shrink-0 rounded-lg bg-surface px-3 py-1 text-xs font-medium text-text-subtle">미선택</span>
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
        </Card>
      ))}
    </div>
  )
}
