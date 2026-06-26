import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { ProgressBar } from '@jisane/ui/progress-bar'
import { SuccessToast } from '@jisane/ui/toast'
import type { RequestRow, DealRow, DealWorkflowRow, PartnerRow } from '@jisane/shared/types'
import { QuoteSection } from './quote-section'
import { InspectionSection } from './inspection-section'
import { MessageThread } from './message-thread'
import { ReviewSection } from './review-section'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StatusDetailPage(props: PageProps) {
  const { id } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // client_id 조회
  const { data: client } = await adminClient
    .from('client')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) {
    redirect('/')
  }

  // request 조회 (소유권 확인 포함)
  const { data: request } = await adminClient
    .from('request')
    .select('*')
    .eq('id', id)
    .eq('client_id', client.id)
    .single()

  if (!request) {
    redirect('/status')
  }

  const req = request as RequestRow

  // 관련 deal 조회
  const { data: deals } = await adminClient
    .from('deal')
    .select('*')
    .eq('request_id', id)

  const deal = (deals && deals.length > 0 ? deals[0] : null) as DealRow | null

  // deal이 있으면 workflow + partner + messages + review 조회
  let workflows: DealWorkflowRow[] = []
  let partner: PartnerRow | null = null
  let messages: Array<{ id: string; sender_type: string; content: string; created_at: string }> = []
  let existingReview: { id: string; rating: number | null; comment: string | null } | null = null

  if (deal) {
    const [{ data: wf }, { data: msgs }, { data: review }] = await Promise.all([
      adminClient
        .from('deal_workflow')
        .select('*')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: true }),
      adminClient
        .from('deal_message')
        .select('id, sender_type, content, created_at')
        .eq('deal_id', deal.id)
        .order('created_at', { ascending: true }),
      adminClient
        .from('review')
        .select('id, rating, comment')
        .eq('deal_id', deal.id)
        .eq('author_type', 'client')
        .single(),
    ])
    workflows = (wf || []) as DealWorkflowRow[]
    messages = (msgs || []) as typeof messages
    existingReview = review as typeof existingReview

    if (deal.partner_id) {
      const { data: p } = await adminClient
        .from('partner')
        .select('id, auth_user_id, name, field, career_yrs, grade')
        .eq('id', deal.partner_id)
        .single()
      partner = p as PartnerRow | null
    }
  }

  // 24h 카운트다운 계산 (접수 후)
  const createdAt = new Date(req.created_at)
  const deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
  const now = new Date()
  const remainingMs = deadline.getTime() - now.getTime()
  const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)))

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <Suspense><SuccessToast /></Suspense>
      {/* 뒤로가기 */}
      <Link href="/status" className="mb-4 text-sm text-text-muted hover:text-text transition-colors">
        &larr; 의뢰 목록
      </Link>

      {/* 제목 + 상태 */}
      <h1 className="mb-2 text-xl font-bold text-text">{req.title}</h1>
      <p className="mb-6 text-xs text-text-muted">
        {new Date(req.created_at).toLocaleDateString('ko-KR')}
        {req.req_type && ` · ${req.req_type}`}
      </p>

      {/* 프로그레스 바 */}
      <div className="mb-6">
        <ProgressBar requestStatus={req.status} dealStatus={deal?.status} />
      </div>

      {/* 상태별 콘텐츠 */}
      {req.status === 'open' && (
        <div className="rounded-xl border border-border-light p-4 shadow-xs">
          <h2 className="mb-2 font-semibold text-text">접수 완료</h2>
          <p className="text-sm text-text-muted">
            지사네 매니저가 의뢰를 확인하고 적합한 시니어 전문가를 연결해드립니다.
          </p>
          {remainingHours > 0 && (
            <p className="mt-3 text-sm font-semibold text-accent">
              견적 기한: 약 {remainingHours}시간 남음
            </p>
          )}
        </div>
      )}

      {req.status === 'matching' && (
        <div className="rounded-xl border border-border-light p-4 shadow-xs">
          <h2 className="mb-2 font-semibold text-text">시니어 연결 중</h2>
          <p className="text-sm text-text-muted">
            적합한 시니어 전문가를 찾고 있습니다. 곧 견적을 보내드리겠습니다.
          </p>
        </div>
      )}

      {/* 견적 카드 (deal 존재 + quoted 상태) */}
      {deal && deal.status === 'quoted' && (
        <QuoteSection deal={deal} partner={partner} />
      )}

      {/* 작업 진행 중 */}
      {deal && deal.status === 'working' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-border-light p-4 shadow-xs">
            <h2 className="mb-2 font-semibold text-text">작업 진행 중</h2>
            {deal.due_date && (
              <p className="text-sm text-text-muted">
                예상 완료일: {new Date(deal.due_date).toLocaleDateString('ko-KR')}
              </p>
            )}
          </div>

          {/* 워크플로우 5단계 현황 */}
          {workflows.length > 0 && (
            <div className="rounded-xl border border-border-light p-4 shadow-xs">
              <h3 className="mb-3 text-sm font-semibold text-text">작업 진행 단계</h3>
              <div className="flex flex-col gap-2">
                {workflows.map((wf) => (
                  <div key={wf.id} className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        wf.status === 'done'
                          ? 'bg-success'
                          : wf.status === 'in_progress'
                          ? 'bg-warning'
                          : 'bg-border'
                      }`}
                    />
                    <span className="text-sm text-text">
                      {WORKFLOW_LABELS[wf.step] || wf.step}
                    </span>
                    <span className="text-xs text-text-muted">
                      {STEP_STATUS_LABELS[wf.status] || wf.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메시지 스레드 */}
          <MessageThread dealId={deal.id} messages={messages} />

          {/* 검수 섹션 */}
          <InspectionSection dealId={deal.id} />
        </div>
      )}

      {/* 완료 */}
      {deal && deal.status === 'done' && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-success/20 bg-success-light p-4">
            <h2 className="mb-2 font-semibold text-success">검수 완료</h2>
            <p className="text-sm text-success/80">
              작업이 완료되었습니다. 정산이 진행됩니다.
            </p>
          </div>

          {/* 리뷰 섹션 */}
          <ReviewSection dealId={deal.id} existingReview={existingReview} />

          {/* 완료 후에도 메시지 확인 가능 */}
          {messages.length > 0 && (
            <MessageThread dealId={deal.id} messages={messages} />
          )}
        </div>
      )}

      {/* 서류 다운로드 */}
      {deal && (
        <div className="mt-4 flex gap-2">
          <Link
            href={`/docs/quote/${deal.id}`}
            target="_blank"
            className="rounded-xl border border-border-light px-4 py-2.5 text-sm font-medium text-text-muted shadow-xs transition-all hover:bg-surface hover:text-text hover:shadow-sm"
          >
            견적서 보기
          </Link>
          <Link
            href={`/docs/statement/${deal.id}`}
            target="_blank"
            className="rounded-xl border border-border-light px-4 py-2.5 text-sm font-medium text-text-muted shadow-xs transition-all hover:bg-surface hover:text-text hover:shadow-sm"
          >
            거래명세서 보기
          </Link>
        </div>
      )}

      {/* 의뢰 상세 내용 */}
      <div className="mt-6 rounded-xl border border-border-light p-4 shadow-xs">
        <h3 className="mb-2 text-sm font-semibold text-text">의뢰 내용</h3>
        <p className="whitespace-pre-wrap text-sm text-text-muted">{req.detail}</p>
        {req.budget_hope && (
          <p className="mt-2 text-sm text-text-muted">
            희망 예산: {req.budget_hope.toLocaleString('ko-KR')}원
          </p>
        )}
      </div>
    </div>
  )
}

const WORKFLOW_LABELS: Record<string, string> = {
  intake: '요건 파악',
  structure: '구조화',
  generate: '작업 수행',
  verify: '검증',
  deliver: '납품',
}

const STEP_STATUS_LABELS: Record<string, string> = {
  pending: '대기',
  in_progress: '진행 중',
  done: '완료',
}
