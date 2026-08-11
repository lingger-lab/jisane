import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signOut } from '@jisane/shared/auth/actions'
import { DEAL_STATUS_LABELS, ORDER_STATUS_LABELS, MATCHING_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from '@jisane/shared/labels'
import {
  DEAL_STATUS_BADGE_CLASSES,
  ORDER_STATUS_BADGE_CLASSES,
  MATCHING_STATUS_BADGE_CLASSES,
} from '@jisane/shared/status-badges'
import { PageHero } from '@jisane/ui/page-hero'
import { ProfileEditor } from '@/components/profile-editor'

export default async function MyPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: expert } = await adminClient
    .from('expert')
    .select('id, name, field, career_years, hourly_rate, contact, email, grade, created_at, career_score, review_score, completion_score, total_score, activity_points')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert) redirect('/register')

  // 전문 분야 파싱 (콤마 구분)
  const expertFields = (expert.field || '').split(',').map((f: string) => f.trim()).filter(Boolean)

  // 작업 / 교육서비스 / 매칭 / 활동 / 관심표현 / 맞춤의뢰 현황 병렬 조회
  const [dealsRes, ordersRes, matchingsRes, activitiesRes, interestsRes, matchedRequestsRes] = await Promise.all([
    adminClient
      .from('deal')
      .select('id, status, work_fee, created_at, request:request!inner(title)')
      .eq('expert_id', expert.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('service_order')
      .select('id, package_name, status, created_at, price')
      .eq('expert_id', expert.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('matching_candidate')
      .select('id, status, created_at, request:request!inner(title, req_type)')
      .eq('expert_id', expert.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('expert_activity')
      .select('id, type, points, created_at, expires_at')
      .eq('expert_id', expert.id)
      .order('created_at', { ascending: false })
      .limit(10),
    // 관심 표현 이력
    adminClient
      .from('expert_interest')
      .select('id, note, created_at, request:request!inner(id, title, status)')
      .eq('expert_id', expert.id)
      .order('created_at', { ascending: false })
      .limit(10),
    // 내 분야 공개 의뢰
    expertFields.length > 0
      ? adminClient
          .from('request')
          .select('id, title, req_type, budget_hope, created_at')
          .eq('status', 'open')
          .in('req_type', expertFields)
          .order('created_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (dealsRes.error) console.error('[mypage] deal query failed:', dealsRes.error.message)
  if (ordersRes.error) console.error('[mypage] service_order query failed:', ordersRes.error.message)
  if (matchingsRes.error) console.error('[mypage] matching_candidate query failed:', matchingsRes.error.message)
  if (activitiesRes.error) console.error('[mypage] expert_activity query failed:', activitiesRes.error.message)
  if (interestsRes.error) console.error('[mypage] expert_interest query failed:', interestsRes.error.message)
  if (matchedRequestsRes.error) console.error('[mypage] matched requests query failed:', matchedRequestsRes.error.message)

  const deals = (dealsRes.data || []) as unknown as Array<{
    id: string; status: string; work_fee: number | null; created_at: string
    request: { title: string } | null
  }>
  const orders = (ordersRes.data || []) as Array<{
    id: string; package_name: string; status: string; created_at: string; price: number
  }>
  const matchings = (matchingsRes.data || []) as unknown as Array<{
    id: string; status: string; created_at: string
    request: { title: string; req_type: string | null } | null
  }>
  const activities = (activitiesRes.data || []) as Array<{
    id: string; type: string; points: number; created_at: string; expires_at: string | null
  }>
  const interests = (interestsRes.data || []) as unknown as Array<{
    id: string; note: string | null; created_at: string
    request: { id: string; title: string; status: string }
  }>
  const activeInterestCount = interests.filter((i) => i.request.status === 'open').length
  const matchedRequests = (matchedRequestsRes.data || []) as Array<{
    id: string; title: string; req_type: string | null; budget_hope: number | null; created_at: string
  }>

  const profile = {
    name: expert.name,
    field: expert.field,
    career_years: expert.career_years,
    hourly_rate: expert.hourly_rate,
    contact: expert.contact,
    email: expert.email,
    grade: expert.grade,
    created_at: expert.created_at,
  }

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero
        eyebrow="시니어지식인회원"
        title="마이페이지"
        subtitle="내 현황을 확인하고 프로필을 수정할 수 있습니다."
      />
      <div className="responsive-container px-4 md:px-6 py-6">

      {/* 프로필 요약 카드 */}
      <div className="mb-6 rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent">
            {(expert.name || expert.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-text">{expert.name || '이름 미등록'}</p>
            <p className="text-xs text-text-muted">{expert.email}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-3 text-xs text-text-muted">
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-medium text-accent">
            {expert.grade === 'veteran' ? '베테랑' : expert.grade === 'new' ? '신규' : '스탠다드'}
          </span>
          <span>가입: {new Date(expert.created_at).toLocaleDateString('ko-KR')}</span>
        </div>
      </div>

      {/* 프로필 편집 (개인정보 수정) — 상단 */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-bold text-text">프로필 편집</h2>
        <ProfileEditor profile={profile} />
      </section>

      {/* 종합점수 카드 */}
      <div className="mb-6 rounded-xl border border-border-light bg-background p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-text">내 전문점수</h2>
          <span className="text-2xl font-bold text-accent">{expert.total_score?.toFixed(1) ?? '—'}</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="rounded-lg bg-surface p-2">
            <p className="text-xs text-text-muted">경력</p>
            <p className="font-bold text-text">{expert.career_score?.toFixed(1) ?? '—'}</p>
          </div>
          <div className="rounded-lg bg-surface p-2">
            <p className="text-xs text-text-muted">리뷰</p>
            <p className="font-bold text-text">{expert.review_score?.toFixed(1) ?? '—'}</p>
          </div>
          <div className="rounded-lg bg-surface p-2">
            <p className="text-xs text-text-muted">완료율</p>
            <p className="font-bold text-text">{expert.completion_score?.toFixed(1) ?? '—'}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-text-subtle text-center">
          (경력×1 + 리뷰×2 + 완료율×1) ÷ 4
          {expert.activity_points > 0 && ` · 활동 +${expert.activity_points}`}
        </p>
      </div>

      {/* 내 분야 공개 의뢰 */}
      {matchedRequests.length > 0 && (
        <section className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-text">내 분야 공개 의뢰</h2>
            <Link href="/requests" className="text-xs font-medium text-accent hover:underline">전체 보기</Link>
          </div>
          <ul className="flex flex-col gap-2">
            {matchedRequests.map((req) => (
              <li key={req.id}>
                <Link
                  href={`/requests/${req.id}`}
                  className="flex items-center justify-between rounded-lg border border-border-light p-3 shadow-xs card-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{req.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(req.created_at).toLocaleDateString('ko-KR')}
                      {req.req_type && ` · ${req.req_type}`}
                      {req.budget_hope != null && ` · ${req.budget_hope.toLocaleString('ko-KR')}원`}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-info-light px-2 py-0.5 text-xs font-medium text-info">
                    공개
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 섹션 A — 작업 현황 */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text">작업 현황</h2>
          <Link href="/work" className="text-xs font-medium text-accent hover:underline">전체 보기</Link>
        </div>
        {deals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">진행 중인 작업이 없습니다</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {deals.map((deal) => (
              <li key={deal.id}>
                <Link
                  href={`/work/${deal.id}`}
                  className="flex items-center justify-between rounded-lg border border-border-light p-3 shadow-xs card-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{deal.request?.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(deal.created_at).toLocaleDateString('ko-KR')}
                      {deal.work_fee != null && ` · ${deal.work_fee.toLocaleString('ko-KR')}원`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${DEAL_STATUS_BADGE_CLASSES[deal.status] || 'bg-surface text-text-subtle'}`}>
                    {DEAL_STATUS_LABELS[deal.status] || deal.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 섹션 B — 교육·서비스 신청 현황 */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text">교육·서비스 현황</h2>
          <Link href="/matching" className="text-xs font-medium text-accent hover:underline">전체 보기</Link>
        </div>
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">신청한 교육·서비스가 없습니다</p>
            <Link href="/education" className="text-sm font-medium text-accent hover:underline">교육 둘러보기</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {orders.map((order) => (
              <li key={order.id}>
                <div className="rounded-lg border border-border-light p-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{order.package_name}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {new Date(order.created_at).toLocaleDateString('ko-KR')}
                        {' · '}
                        {order.price === 0 ? '무료' : `${order.price.toLocaleString('ko-KR')}원`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_BADGE_CLASSES[order.status] || 'bg-surface text-text-subtle'}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  {order.status === 'pending' && (
                    <p className="mt-2 text-xs text-info">접수 완료 — 매니저 연락 예정</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 섹션 C — 매칭 현황 */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text">매칭 현황</h2>
          <Link href="/matching" className="text-xs font-medium text-accent hover:underline">전체 보기</Link>
        </div>
        {matchings.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">매칭 제안이 없습니다</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {matchings.map((m) => (
              <li key={m.id}>
                <Link
                  href={`/matching/${m.id}`}
                  className="flex items-center justify-between rounded-lg border border-border-light p-3 shadow-xs card-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{m.request?.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(m.created_at).toLocaleDateString('ko-KR')}
                      {m.request?.req_type && ` · ${m.request.req_type}`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${MATCHING_STATUS_BADGE_CLASSES[m.status] || 'bg-surface text-text-subtle'}`}>
                    {MATCHING_STATUS_LABELS[m.status] || m.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 섹션 D — 활동 이력 */}
      {activities.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-base font-bold text-text">활동 이력</h2>
          <ul className="flex flex-col gap-2">
            {activities.map((a) => {
              const isExpired = a.expires_at && new Date(a.expires_at) < new Date()
              return (
                <li key={a.id} className={`rounded-lg border border-border-light p-3 shadow-xs ${isExpired ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-text">
                        {ACTIVITY_TYPE_LABELS[a.type] || a.type}
                        <span className="ml-2 text-xs font-bold text-accent">+{a.points}</span>
                      </p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {new Date(a.created_at).toLocaleDateString('ko-KR')}
                        {a.expires_at && ` ~ ${new Date(a.expires_at).toLocaleDateString('ko-KR')}`}
                      </p>
                    </div>
                    {isExpired && (
                      <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-xs text-text-subtle">만료</span>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* 섹션 E — 관심 표현 이력 */}
      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text">관심 표현 이력</h2>
          <span className="text-xs font-medium text-text-muted">
            활성 {activeInterestCount}/5개
          </span>
        </div>
        {interests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">관심 표현 이력이 없습니다</p>
            <Link href="/requests" className="text-sm font-medium text-accent hover:underline">공개 의뢰 둘러보기</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {interests.map((interest) => (
              <li key={interest.id}>
                <Link
                  href={`/requests/${interest.request.id}`}
                  className="flex items-center justify-between rounded-lg border border-border-light p-3 shadow-xs card-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{interest.request.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(interest.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    interest.request.status === 'open' ? 'bg-info-light text-info' : 'bg-surface text-text-subtle'
                  }`}>
                    {interest.request.status === 'open' ? '활성' : '종료'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 로그아웃 */}
      <form action={signOut}>
        <button
          type="submit"
          className="w-full rounded-xl border border-border-light px-6 py-3 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
        >
          로그아웃
        </button>
      </form>
      </div>
    </div>
  )
}
