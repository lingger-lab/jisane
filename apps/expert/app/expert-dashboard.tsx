import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { SearchBox } from '@jisane/ui/search-box'
import type { MatchingStatus, ServiceOrderRow } from '@jisane/shared/types'
import { MATCHING_STATUS_LABELS, ORDER_STATUS_LABELS } from '@jisane/shared/labels'
import { OpportunitySection } from './(main)/matching/opportunity-section'

const STATUS_COLORS: Record<MatchingStatus, string> = {
  proposed: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  rejected: 'bg-surface text-text-subtle',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-info-light text-info',
  paid: 'bg-warning-light text-warning',
  processing: 'bg-success-light text-success',
  completed: 'bg-surface text-text-subtle',
  cancelled: 'bg-error-light text-error',
}

const ORDER_STRIPE: Record<string, string> = {
  pending: 'border-l-info',
  paid: 'border-l-warning',
  processing: 'border-l-success',
  completed: 'border-l-border',
  cancelled: 'border-l-error',
}

/**
 * 로그인한 시니어지식인의 홈 대시보드 — 랜딩(redirect) 대신 홈에 렌더.
 * 인사 + 요약(매칭 제안·진행 작업) + 매칭 제안 목록 + 열린 의뢰 탐색·검색 + 교육/서비스 현황.
 */
export async function ExpertDashboard({
  expertId,
  name,
  field,
}: {
  expertId: string
  name: string | null
  field: string | null
}) {
  const [{ data: matchings }, { data: serviceOrdersData }, { data: openRequests }, { data: myInterests }] = await Promise.all([
    adminClient
      .from('matching')
      .select('id, status, created_at, request:request!inner(id, title, req_type, budget_hope)')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false }),
    adminClient
      .from('service_order')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false }),
    adminClient
      .from('request')
      .select('id, title, req_type, budget_hope, detail, created_at')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(20),
    adminClient
      .from('expert_interest')
      .select('request_id')
      .eq('expert_id', expertId),
  ])

  const matchingList = ((matchings || []) as unknown) as Array<{
    id: string
    status: MatchingStatus
    created_at: string
    request: { id: string; title: string; req_type: string | null; budget_hope: number | null }
  }>

  const serviceOrders = (serviceOrdersData || []) as ServiceOrderRow[]
  const interestedIds = (myInterests || []).map((i) => i.request_id)
  const opportunities = (openRequests || []) as Array<{
    id: string; title: string; req_type: string | null; budget_hope: number | null; detail: string; created_at: string
  }>

  const proposedCount = matchingList.filter((m) => m.status === 'proposed').length

  const { count: workingCount } = await adminClient
    .from('deal')
    .select('id', { count: 'exact', head: true })
    .eq('expert_id', expertId)
    .eq('status', 'working')

  const profileIncomplete = !field

  return (
    <div className="flex flex-1 flex-col animate-fade-in">

      {/* 인사 히어로 */}
      <div className="hero-dark w-full">
        <section className="responsive-container flex flex-col gap-1 px-4 md:px-6 pt-10 md:pt-14 pb-8 md:pb-10">
          <span className="hero-eyebrow self-start">시니어지식인공간</span>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-white leading-snug">
            {name || '시니어지식인'}님, 반갑습니다
          </h1>
          <p className="text-sm md:text-base text-white/75">매칭 제안과 열린 의뢰를 한눈에 확인하세요.</p>
        </section>
      </div>

      <main className="responsive-container flex w-full flex-col px-4 md:px-6 py-6">
        {/* 프로필 미완성 배너 */}
        {profileIncomplete && (
          <Link
            href="/mypage"
            className="mb-4 flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4 transition-colors hover:bg-warning/10"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-warning/15 text-sm">!</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-text">프로필을 완성해주세요</p>
              <p className="text-xs text-text-muted">전문 분야를 등록하면 매칭 확률이 높아집니다</p>
            </div>
            <span className="text-xs font-medium text-warning">완성하기</span>
          </Link>
        )}

        {/* 요약 카드 */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border-light bg-surface-warm p-4 text-center">
            <p className="text-2xl font-bold text-accent">{proposedCount}</p>
            <p className="text-xs text-text-muted">새 매칭 제안</p>
          </div>
          <Link href="/work" className="rounded-xl border border-border-light bg-surface-warm p-4 text-center transition-colors hover:bg-surface">
            <p className="text-2xl font-bold text-accent">{workingCount || 0}</p>
            <p className="text-xs text-text-muted">진행 중 작업</p>
          </Link>
        </div>

        {/* 매칭 리스트 */}
        <h2 className="mb-3 text-base font-bold text-text">매칭 제안</h2>
        {matchingList.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 text-center py-10">
            <p className="text-text-muted">아직 매칭 제안이 없습니다.</p>
            <p className="text-xs text-text-subtle max-w-xs">
              {profileIncomplete
                ? '프로필을 완성하면 지사네 매니저가 적합한 의뢰를 연결해드립니다.'
                : '지사네 매니저가 적합한 의뢰를 연결해드립니다.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {matchingList.map((m) => (
              <li key={m.id}>
                <Link href={`/matching/${m.id}`} className="block rounded-xl border border-border-light p-4 shadow-xs card-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-text">{m.request.title}</h3>
                      <p className="mt-1 text-xs text-text-muted">
                        {new Date(m.created_at).toLocaleDateString('ko-KR')}
                        {m.request.req_type && ` · ${m.request.req_type}`}
                      </p>
                      {m.request.budget_hope && (
                        <p className="mt-1 text-sm font-medium text-text">
                          작업비: {m.request.budget_hope.toLocaleString('ko-KR')}원
                        </p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[m.status]}`}>
                      {MATCHING_STATUS_LABELS[m.status]}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* 열린 의뢰 탐색 + 검색 */}
        <h2 className="mb-3 mt-8 text-base font-bold text-text">열린 의뢰 탐색</h2>
        <p className="mb-3 text-xs text-text-muted">관심 있는 의뢰에 관심을 표현하면 매니저가 우선 검토합니다.</p>
        <div className="mb-4">
          <SearchBox target="/requests" placeholder="제목·내용으로 열린 의뢰 검색" colorToken="accent" />
        </div>
        <OpportunitySection requests={opportunities} interestedIds={interestedIds} />

        {/* 교육·서비스 신청 현황 */}
        <h2 className="mb-3 mt-8 text-base font-bold text-text">교육·서비스 신청 현황</h2>
        {serviceOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">신청한 교육·서비스가 없습니다.</p>
            <Link href="/education" className="text-sm font-medium text-accent hover:underline">
              교육 둘러보기
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {serviceOrders.map((order) => (
              <li key={order.id}>
                <div className={`rounded-xl border border-border-light border-l-4 ${ORDER_STRIPE[order.status] || 'border-l-border'} p-4 shadow-xs`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-text">{order.package_name}</h3>
                      <p className="mt-1 text-xs text-text-muted">
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                        {' · '}
                        {order.price === 0 ? '무료' : `${order.price.toLocaleString('ko-KR')}원`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-surface text-text-subtle'}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
