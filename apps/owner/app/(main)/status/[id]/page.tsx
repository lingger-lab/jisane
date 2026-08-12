import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { isPaymentEnabled, isFreeModeEnabled } from '@jisane/shared/payment'
import { ProgressBar } from '@jisane/ui/progress-bar'
import type { RequestRow, DealRow, DealWorkflowRow, ExpertRow } from '@jisane/shared/types'
import { WORKFLOW_STEP_LABELS, STEP_STATUS_LABELS } from '@jisane/shared/labels'
import { PageHero } from '@jisane/ui/page-hero'
import { ErrorState } from '@jisane/ui/error-state'
import { QuoteSection } from './quote-section'
import { InspectionSection } from './inspection-section'
import { MessageThread } from './message-thread'
import { ReviewSection } from './review-section'
import { DisputeButton } from './dispute-button'

interface PageProps {
  params: Promise<{ id: string }>
}

/**
 * 기반 쿼리(owner·request·deal) 인프라 실패 시의 전면 에러 화면.
 * 실패를 not-found처럼 redirect로 위장하지 않는다(감사 docs/11 P2-44).
 */
function DetailLoadError() {
  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="기업회원"
        title="의뢰 상세"
        back={
          <Link href="/status" className="text-sm text-white/70 hover:text-white transition-colors">
            &larr; 의뢰 목록
          </Link>
        }
      />
      <div className="responsive-container px-4 md:px-6 py-6">
        <ErrorState message="의뢰 정보를 불러오지 못했습니다." />
      </div>
    </div>
  )
}

export default async function StatusDetailPage(props: PageProps) {
  const { id } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // owner_id 조회 — 인프라 실패(PGRST116 외)는 미가입으로 위장하지 않고 에러 화면(감사 docs/11 P2-44)
  const { data: owner, error: ownerError } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (ownerError && ownerError.code !== 'PGRST116') {
    console.error('[status/detail] owner 조회 실패:', ownerError)
    return <DetailLoadError />
  }
  if (!owner) {
    redirect('/')
  }

  // request 조회 (소유권 확인 포함) — 조회 실패와 not-found(0행)를 구분한다
  const { data: request, error: requestError } = await adminClient
    .from('request')
    .select('*')
    .eq('id', id)
    .eq('owner_id', owner.id)
    .single()

  if (requestError && requestError.code !== 'PGRST116') {
    console.error('[status/detail] request 조회 실패:', requestError)
    return <DetailLoadError />
  }
  if (!request) {
    redirect('/status')
  }

  const req = request as RequestRow

  // 관련 deal 조회.
  // request_id에 unique 제약이 없어 한 의뢰에 deal이 여러 건 존재할 수 있다(매칭 복수 수락·초빙).
  // ORDER BY 없이 첫 행을 쓰면 어떤 deal의 금액을 청구하는지가 비결정적이므로 최신 건으로 고정한다.
  const { data: deals, error: dealsError } = await adminClient
    .from('deal')
    .select('*')
    .eq('request_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (dealsError) {
    // deal 여부가 이하 모든 상태 분기의 기반 — 실패를 "진행 상황 확인 중"으로 위장하지 않는다.
    console.error('[status/detail] deal 조회 실패:', dealsError)
    return <DetailLoadError />
  }

  const deal = (deals && deals.length > 0 ? deals[0] : null) as DealRow | null

  // deal이 있으면 workflow + expert + messages + review 조회
  let workflows: DealWorkflowRow[] = []
  let expert: ExpertRow | null = null
  let messages: Array<{ id: string; sender_type: string; content: string; created_at: string }> = []
  let existingReview: { id: string; rating: number | null; comment: string | null } | null = null
  let settlementId: string | null = null
  let hasOpenDispute = false
  // 섹션 쿼리 실패 플래그 — 실패한 섹션만 에러 상태로 렌더한다(전체 페이지는 유지)
  let workflowsFailed = false
  let messagesFailed = false
  let reviewFailed = false

  if (deal) {
    const [{ data: wf, error: wfError }, { data: msgs, error: msgsError }, { data: review, error: reviewError }] = await Promise.all([
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
        .eq('author_type', 'owner')
        .single(),
    ])
    if (wfError) console.error('[status/detail] deal_workflow 조회 실패:', wfError)
    if (msgsError) console.error('[status/detail] deal_message 조회 실패:', msgsError)
    // review는 .single() — 0행(PGRST116)은 "아직 리뷰 없음"이라는 정상 상태다
    if (reviewError && reviewError.code !== 'PGRST116') {
      console.error('[status/detail] review 조회 실패:', reviewError)
      reviewFailed = true
    }
    workflowsFailed = Boolean(wfError)
    messagesFailed = Boolean(msgsError)
    workflows = (wf || []) as DealWorkflowRow[]
    messages = (msgs || []) as typeof messages
    existingReview = review as typeof existingReview

    if (deal.expert_id) {
      const { data: p, error: expertError } = await adminClient
        .from('expert')
        .select('id, auth_user_id, name, field, career_years, grade')
        .eq('id', deal.expert_id)
        .single()
      if (expertError) console.error('[status/detail] expert 조회 실패:', expertError)
      expert = p as ExpertRow | null
    }

    // 정산 + 이의제기 조회 (done 상태에서만 필요하지만 미리 조회)
    if (deal.status === 'done') {
      const { data: settle, error: settleError } = await adminClient
        .from('settlement')
        .select('id')
        .eq('deal_id', deal.id)
        .single()
      if (settleError && settleError.code !== 'PGRST116') {
        console.error('[status/detail] settlement 조회 실패:', settleError)
      }
      if (settle) {
        settlementId = settle.id
        const { data: disputes, error: disputesError } = await adminClient
          .from('dispute')
          .select('id')
          .eq('target_type', 'settlement')
          .eq('target_id', settle.id)
          .eq('status', 'open')
          .limit(1)
        if (disputesError) console.error('[status/detail] dispute 조회 실패:', disputesError)
        hasOpenDispute = (disputes && disputes.length > 0) || false
      }
    }
  }

  // 24h 카운트다운 계산 (접수 후)
  const createdAt = new Date(req.created_at)
  const deadline = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000)
  const now = new Date()
  const remainingMs = deadline.getTime() - now.getTime()
  const remainingHours = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60)))

  return (
    <div className="flex flex-1 flex-col animate-fade-in">

      <PageHero
        eyebrow="기업회원"
        title={req.title}
        subtitle={`${new Date(req.created_at).toLocaleDateString('ko-KR')}${req.req_type ? ` · ${req.req_type}` : ''}`}
        back={
          <Link href="/status" className="text-sm text-white/70 hover:text-white transition-colors">
            &larr; 의뢰 목록
          </Link>
        }
      />

      <div className="responsive-container px-4 md:px-6 py-6">
      {/* 프로그레스 바 */}
      <div className="mb-6">
        <ProgressBar requestStatus={req.status} dealStatus={deal?.status} />
      </div>

      {/* 상태별 콘텐츠 */}
      {req.status === 'open' && (
        <div className="rounded-xl border border-border-light p-4 shadow-xs">
          <h2 className="mb-2 font-semibold text-text">접수 완료</h2>
          <p className="text-sm text-text-muted">
            지사네 매니저가 의뢰를 확인하고 적합한 시니어지식인을 연결해드립니다.
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
          <h2 className="mb-2 font-semibold text-text">시니어지식인 연결 중</h2>
          <p className="text-sm text-text-muted">
            적합한 시니어지식인을 찾고 있습니다. 곧 견적을 보내드리겠습니다.
          </p>
        </div>
      )}

      {/* 견적 카드 (deal 존재 + quoted 상태).
          화면에 쓰는 필드만 전달한다 — 클라이언트 컴포넌트라 props가 브라우저에 직렬화되므로
          deal/expert 전체를 넘기면 내부 수수료·전문가 실명이 노출된다. */}
      {deal && deal.status === 'quoted' && (
        <QuoteSection
          deal={{ id: deal.id, total_pay: deal.total_pay, due_date: deal.due_date }}
          expert={expert ? { field: expert.field, career_years: expert.career_years } : null}
          paymentEnabled={isPaymentEnabled()}
          freeModeEnabled={isFreeModeEnabled()}
        />
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

          {/* 워크플로우 5단계 현황 — 조회 실패 시 숨기지 않고 에러 상태 */}
          {workflowsFailed && (
            <ErrorState message="작업 진행 단계를 불러오지 못했습니다." />
          )}
          {!workflowsFailed && workflows.length > 0 && (
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
                      {WORKFLOW_STEP_LABELS[wf.step] || wf.step}
                    </span>
                    <span className="text-xs text-text-muted">
                      {STEP_STATUS_LABELS[wf.status] || wf.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메시지 스레드 — 조회 실패를 "메시지 없음"으로 위장하지 않는다 */}
          {messagesFailed ? (
            <ErrorState message="메시지를 불러오지 못했습니다." />
          ) : (
            <MessageThread dealId={deal.id} messages={messages} />
          )}

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

          {/* 리뷰 섹션 — 조회 실패 시 "리뷰 없음"으로 위장해 중복 작성을 유도하지 않는다 */}
          {reviewFailed ? (
            <ErrorState message="리뷰 정보를 불러오지 못했습니다." />
          ) : (
            <ReviewSection dealId={deal.id} existingReview={existingReview} />
          )}

          {/* 정산 이의제기 */}
          {settlementId && (
            <DisputeButton settlementId={settlementId} hasOpenDispute={hasOpenDispute} />
          )}

          {/* 완료 후에도 메시지 확인 가능 — 조회 실패는 숨기지 않고 에러 상태 */}
          {messagesFailed ? (
            <ErrorState message="메시지를 불러오지 못했습니다." />
          ) : (
            messages.length > 0 && <MessageThread dealId={deal.id} messages={messages} />
          )}
        </div>
      )}

      {/* 위 분기가 모두 빗나가는 조합(예: request가 dealt/closed인데 deal이 없거나
          deal이 표시 대상 상태가 아닌 경우) — 안내 없이 프로그레스 바만 남는 막다른 화면을 막는다. */}
      {!(req.status === 'open' || req.status === 'matching') &&
        !(deal && ['quoted', 'working', 'done'].includes(deal.status)) && (
          <div className="rounded-xl border border-border-light p-4 shadow-xs">
            <h2 className="mb-2 font-semibold text-text">
              {req.status === 'closed' ? '종료된 의뢰입니다' : '진행 상황을 확인 중입니다'}
            </h2>
            <p className="text-sm text-text-muted">
              {req.status === 'closed'
                ? '이 의뢰는 종료되었습니다. 새로운 의뢰가 필요하시면 의뢰하기에서 등록해주세요.'
                : '표시할 상세 내용이 아직 없습니다. 잠시 후 다시 확인해주시고, 계속 이 화면이 보이면 문의해주세요.'}
            </p>
            <Link
              href="/status"
              className="focus-ring mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              의뢰 목록으로
            </Link>
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
    </div>
  )
}

