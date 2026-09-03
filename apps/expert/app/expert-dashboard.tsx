import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { SearchBox } from '@jisane/ui/search-box'
import { ErrorState } from '@jisane/ui/error-state'
import type { MatchingStatus, ServiceOrderRow } from '@jisane/shared/types'
import { MATCHING_STATUS_LABELS } from '@jisane/shared/labels'
import { MATCHING_STATUS_BADGE_CLASSES } from '@jisane/shared/status-badges'
import { StatusBadge } from '@jisane/ui/status-badge'
import { StatCard } from '@jisane/ui/stat-card'
import { ServiceBanner } from '@jisane/ui/service-banner'
import { PartnerAdStrip } from '@jisane/ui/partner-ad-strip'
import { ServiceCarousel, type ServiceCarouselItem } from '@jisane/ui/service-carousel'
import { HeroBackdrop } from '@jisane/ui/hero-backdrop'
import { getRecentPackagesByProvider, getAllPublishedPackages } from '@jisane/shared/service-package/queries'
import { pickShowcase } from '@jisane/shared/service-package/showcase'
import { formatPackagePrice, CATEGORY_LABELS } from '@jisane/shared/service-catalog'
import { ADMIN_URL } from '@/lib/urls'
import { OpportunitySection } from './(main)/matching/opportunity-section'

// 매칭 배지는 이 화면에서 rejected를 에러색이 아닌 중립색으로 표시해 온 의도적 오버라이드가 있어
// StatusBadge(단일 소스)로 바꾸지 않고 인라인 유지한다(표시 보존).
const STATUS_COLORS: Record<MatchingStatus, string> = {
  proposed: MATCHING_STATUS_BADGE_CLASSES.proposed,
  accepted: MATCHING_STATUS_BADGE_CLASSES.accepted,
  rejected: 'bg-surface text-text-subtle',
}

/**
 * 로그인한 시니어지식인의 홈 대시보드 — 랜딩(redirect) 대신 홈에 렌더.
 * 인사 + 요약(매칭 제안·진행 작업) + 매칭 제안 목록 + 열린 의뢰 탐색·검색 + 교육/서비스 현황.
 */
export async function ExpertDashboard({
  expertId,
  name,
  field,
  providerId,
}: {
  expertId: string
  name: string | null
  field: string | null
  /** 공급자(provider) 연결 시 본인 등록 지식서비스를 노출. 미연결이면 null */
  providerId?: string | null
}) {
  const [
    { data: matchings, error: matchingsError },
    { data: serviceOrdersData, error: serviceOrdersError },
    { data: openRequests, error: openRequestsError },
    { data: myInterests, error: myInterestsError },
  ] = await Promise.all([
    adminClient
      .from('matching')
      .select('id, status, created_at, request:request!inner(id, title, req_type, budget_hope)')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false })
      // 명시 상한 — 오래 활동한 계정은 전체 이력이 무한 성장한다(감사 docs/11 P3-60).
      .limit(50),
    adminClient
      .from('service_order')
      .select('*')
      .eq('expert_id', expertId)
      .order('created_at', { ascending: false })
      .limit(50),
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

  // 쿼리 실패는 서버에 기록하고, 해당 섹션만 빈 상태 대신 에러 상태로 렌더한다(감사 docs/10 P2-31).
  if (matchingsError) console.error('[ExpertDashboard] matchings query failed:', matchingsError.message)
  if (serviceOrdersError) console.error('[ExpertDashboard] service_order query failed:', serviceOrdersError.message)
  if (openRequestsError) console.error('[ExpertDashboard] open requests query failed:', openRequestsError.message)
  if (myInterestsError) console.error('[ExpertDashboard] expert_interest query failed:', myInterestsError.message)

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

  const { count: workingCount, error: workingCountError } = await adminClient
    .from('deal')
    .select('id', { count: 'exact', head: true })
    .eq('expert_id', expertId)
    .eq('status', 'working')

  if (workingCountError) console.error('[ExpertDashboard] working deal count failed:', workingCountError.message)

  // 본인이 공급자로 등록한 지식서비스(배너 3개) — provider 미연결이면 빈 배열
  const myServices = providerId ? await getRecentPackagesByProvider(providerId, 3) : []

  // 지사네가 제공하는 공개 지식서비스 카탈로그 — 로그인 후에도 홈에서 접근(랜딩과 동일 캐러셀).
  const catalog = await getAllPublishedPackages()
  const showcase: ServiceCarouselItem[] = pickShowcase(catalog, 9).map((pkg) => ({
    key: pkg.slug,
    href: `${ADMIN_URL}/knowledge/${pkg.slug}`,
    name: pkg.name,
    provider: pkg.provider,
    bannerUrl: pkg.bannerUrl ?? null,
    priceLabel: formatPackagePrice(pkg),
    categoryLabel: CATEGORY_LABELS[pkg.category],
    isOfficial: pkg.isOfficial,
    isFree: pkg.isFree,
  }))

  const profileIncomplete = !field

  return (
    <div className="flex flex-1 flex-col animate-fade-in">

      {/* 인사 히어로 */}
      <div className="hero-dark w-full">
        <HeroBackdrop intensity="subtle" />
        <section className="container-app relative z-10 flex flex-col gap-1 px-4 md:px-6 pt-10 md:pt-14 pb-8 md:pb-10">
          <span className="hero-eyebrow self-start animate-slide-up stagger-1">시니어지식인공간</span>
          <h1 className="text-2xl md:text-3xl font-bold font-serif text-white leading-snug animate-slide-up stagger-2">
            {name || '시니어지식인'}님, 반갑습니다
          </h1>
          <p className="text-sm md:text-base text-white/75 animate-slide-up stagger-3">매칭 제안과 열린 의뢰를 한눈에 확인하세요.</p>
        </section>
      </div>

      <main className="container-app flex w-full flex-col px-4 md:px-6 py-6">
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

        {/* 요약 카드 — 조회 실패 시 가짜 0 대신 미확인 표시 */}
        <div className="mb-6 grid grid-cols-2 gap-3">
          <StatCard countTo={matchingsError ? undefined : proposedCount} value={matchingsError ? '—' : undefined} label="새 매칭 제안" accent="accent" emphasis />
          <StatCard href="/work" countTo={workingCountError ? undefined : (workingCount || 0)} value={workingCountError ? '—' : undefined} label="진행 중 작업" accent="accent" />
        </div>

        {/* 지사네 지식서비스 — 지사네가 제공하는 전문 서비스 카탈로그(로그인 후에도 노출) */}
        {showcase.length > 0 && (
          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-text">지사네 지식서비스</h2>
              <a href={`${ADMIN_URL}/knowledge`} className="text-sm font-medium text-accent hover:underline">
                전체보기 &rarr;
              </a>
            </div>
            <ServiceCarousel items={showcase} seeAllHref={`${ADMIN_URL}/knowledge`} />
          </div>
        )}

        {/* 내 지식서비스 — 공급자로 등록한 서비스(배너 3개) + 등록·관리 진입(전문가회원과 동형 대시보드로) */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text">내 지식서비스</h2>
            <a href={`${ADMIN_URL}/partner/dashboard`} className="text-sm font-medium text-accent hover:underline">
              서비스 등록·관리 &rarr;
            </a>
          </div>
          {myServices.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {myServices.map((pkg) => (
                <a
                  key={pkg.slug}
                  href={`${ADMIN_URL}/partner/dashboard/services/${pkg.id}`}
                  className="flex flex-col overflow-hidden rounded-xl border border-border-light bg-card shadow-xs card-hover transition-colors hover:border-accent/30"
                >
                  <ServiceBanner src={pkg.bannerUrl} alt={pkg.name} className="rounded-none" />
                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <h3 className="truncate text-sm font-semibold text-text">{pkg.name}</h3>
                    <span className="text-xs font-medium text-accent tabular-nums">{formatPackagePrice(pkg)}</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
              <p className="text-sm text-text-muted">아직 등록한 지식서비스가 없습니다.</p>
              <a href={`${ADMIN_URL}/partner/dashboard/services/new`} className="text-sm font-medium text-accent hover:underline">
                첫 지식서비스를 등록하세요 &rarr;
              </a>
            </div>
          )}
        </div>

        {/* 매칭 리스트 — 조회 실패(에러)와 제안 없음(빈)을 구분한다 */}
        <h2 className="mb-3 text-lg font-serif font-bold text-text">매칭 제안</h2>
        {matchingsError ? (
          <ErrorState message="매칭 제안을 불러오지 못했습니다." />
        ) : matchingList.length === 0 ? (
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
                      <p className="mt-1 text-xs text-text-muted tabular-nums">
                        {new Date(m.created_at).toLocaleDateString('ko-KR')}
                        {m.request.req_type && ` · ${m.request.req_type}`}
                      </p>
                      {m.request.budget_hope && (
                        <p className="mt-1 text-sm font-medium text-text tabular-nums">
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
        <h2 className="mb-3 mt-8 text-lg font-serif font-bold text-text">열린 의뢰 탐색</h2>
        <p className="mb-3 text-xs text-text-muted">관심 있는 의뢰에 관심을 표현하면 매니저가 우선 검토합니다.</p>
        <div className="mb-4">
          <SearchBox target="/requests" placeholder="제목·내용으로 열린 의뢰 검색" colorToken="accent" />
        </div>
        {openRequestsError ? (
          <ErrorState message="열린 의뢰를 불러오지 못했습니다." />
        ) : (
          <OpportunitySection requests={opportunities} interestedIds={interestedIds} />
        )}

        {/* 교육·서비스 신청 현황 — 조회 실패(에러)와 신청 없음(빈)을 구분한다 */}
        <h2 className="mb-3 mt-8 text-lg font-serif font-bold text-text">교육·서비스 신청 현황</h2>
        {serviceOrdersError ? (
          <ErrorState message="교육·서비스 신청 현황을 불러오지 못했습니다." />
        ) : serviceOrders.length === 0 ? (
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
                <div className="rounded-xl border border-border-light bg-surface-warm p-4 shadow-xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-medium text-text">{order.package_name}</h3>
                      <p className="mt-1 text-xs text-text-muted tabular-nums">
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                        {' · '}
                        {order.price === 0 ? '무료' : `${order.price.toLocaleString('ko-KR')}원`}
                      </p>
                    </div>
                    <StatusBadge kind="order" status={order.status} className="px-2.5" />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 제휴 파트너 광고 */}
        <PartnerAdStrip className="pt-2" />
      </main>
    </div>
  )
}
