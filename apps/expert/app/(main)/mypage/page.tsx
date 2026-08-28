import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signOut } from '@jisane/shared/auth/actions'
import { ACTIVITY_TYPE_LABELS } from '@jisane/shared/labels'
import { PageHero } from '@jisane/ui/page-hero'
import { Avatar } from '@jisane/ui/avatar'
import { ErrorState } from '@jisane/ui/error-state'
import { EmptyState } from '@jisane/ui/empty-state'
import { StatusBadge } from '@jisane/ui/status-badge'
import { DangerZone } from '@jisane/ui/danger-zone'
import { Button } from '@jisane/ui/button'
import { ProfileEditor } from '@/components/profile-editor'
import { withdrawExpertSelf } from '@/lib/expert/actions'
import { enterKnowledgeStudio } from '@/lib/studio/actions'

// 목록 행 공통 스타일 — radius·보더·서피스·그림자를 한 곳에서 고정(정렬 일관).
const ROW = 'rounded-xl border border-border-light bg-surface-warm p-4 shadow-xs'
// 날짜/금액이 섞인 메타 줄 — 숫자 자릿수 정렬(tabular-nums).
const META = 'mt-0.5 text-xs text-text-muted tabular-nums'

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('ko-KR')
}
function fmtWon(v: number) {
  return `${v.toLocaleString('ko-KR')}원`
}

export default async function MyPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: expert } = await adminClient
    .from('expert')
    .select('id, real_name, name, field, career_years, hourly_rate, contact, email, grade, created_at, career_score, review_score, completion_score, total_score, activity_points')
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

  // 쿼리 실패는 서버에 기록하고, 해당 섹션만 빈 상태 대신 에러 상태로 렌더한다(감사 docs/10 P2-28).
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
    real_name: expert.real_name,
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
      <div className="container-app flex flex-col gap-8 px-4 md:px-6 py-6">

        {/* 프로필 요약 카드 */}
        <div className="rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <Avatar id={expert.id} name={expert.name || expert.email} size="md" />
            <div className="min-w-0">
              <p className="truncate font-medium text-text">{expert.name || '이름 미등록'}</p>
              <p className="truncate text-xs text-text-muted">{expert.email}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs text-text-muted">
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-medium text-accent">
              {expert.grade === 'veteran' ? '베테랑' : expert.grade === 'new' ? '신규' : '스탠다드'}
            </span>
            <span className="tabular-nums">가입: {fmtDate(expert.created_at)}</span>
          </div>
        </div>

        {/* 지식서비스 스튜디오 진입 — 파트너와 동일: 바로 등록(배너 포함) → 관리자 검수 → 공개.
            액션이 시니어 provider를 자동 보장한 뒤 스튜디오로 이동(사전승인 단계 없음). */}
        <form action={enterKnowledgeStudio}>
          <button
            type="submit"
            className="block w-full rounded-xl border border-accent/20 bg-accent/5 p-4 text-left shadow-xs card-hover transition-colors hover:border-accent/40"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-text">지식서비스 스튜디오</p>
                <p className="mt-0.5 text-xs text-text-muted">
                  내 지식을 서비스로 등록하고 배너를 셋팅하세요 — 관리자 검수 후 공개됩니다.
                </p>
              </div>
              <span aria-hidden="true" className="shrink-0 text-accent">&rarr;</span>
            </div>
          </button>
        </form>

        {/* 프로필 편집 (개인정보 수정) */}
        <section>
          <h2 className="mb-4 text-lg font-serif font-bold text-text">프로필 편집</h2>
          <ProfileEditor profile={profile} />
        </section>

        {/* 종합점수 카드 */}
        <div className="rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text">내 전문점수</h2>
            <span className="text-2xl font-bold text-accent tabular-nums">{expert.total_score?.toFixed(1) ?? '—'}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="rounded-lg bg-surface p-2">
              <p className="text-xs text-text-muted">경력</p>
              <p className="font-bold text-text tabular-nums">{expert.career_score?.toFixed(1) ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-surface p-2">
              <p className="text-xs text-text-muted">리뷰</p>
              <p className="font-bold text-text tabular-nums">{expert.review_score?.toFixed(1) ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-surface p-2">
              <p className="text-xs text-text-muted">완료율</p>
              <p className="font-bold text-text tabular-nums">{expert.completion_score?.toFixed(1) ?? '—'}</p>
            </div>
          </div>
          <p className="mt-2 text-center text-xs text-text-subtle">
            (경력×1 + 리뷰×2 + 완료율×1) ÷ 4
            {expert.activity_points > 0 && ` · 활동 +${expert.activity_points}`}
          </p>
        </div>

        {/* 내 분야 공개 의뢰 — 조회 실패는 섹션을 숨기지 않고 에러 상태로 표시 */}
        {matchedRequestsRes.error ? (
          <section>
            <h2 className="mb-3 text-lg font-serif font-bold text-text">내 분야 공개 의뢰</h2>
            <ErrorState message="내 분야 공개 의뢰를 불러오지 못했습니다." />
          </section>
        ) : null}
        {!matchedRequestsRes.error && matchedRequests.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-serif font-bold text-text">내 분야 공개 의뢰</h2>
              <Link href="/requests" className="text-xs font-medium text-accent hover:underline">전체 보기</Link>
            </div>
            <ul className="flex flex-col gap-2">
              {matchedRequests.map((req) => (
                <li key={req.id}>
                  <Link href={`/requests/${req.id}`} className={`${ROW} flex items-center justify-between gap-2 card-hover`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{req.title}</p>
                      <p className={META}>
                        {fmtDate(req.created_at)}
                        {req.req_type && ` · ${req.req_type}`}
                        {req.budget_hope != null && ` · ${fmtWon(req.budget_hope)}`}
                      </p>
                    </div>
                    <span className="inline-flex shrink-0 items-center rounded-full bg-info-light px-2 py-0.5 text-xs font-medium text-info">공개</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 섹션 A — 작업 현황 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text">작업 현황</h2>
            <Link href="/work" className="text-xs font-medium text-accent hover:underline">전체 보기</Link>
          </div>
          {dealsRes.error ? (
            <ErrorState message="작업 현황을 불러오지 못했습니다." />
          ) : deals.length === 0 ? (
            <EmptyState message="진행 중인 작업이 없습니다" />
          ) : (
            <ul className="flex flex-col gap-2">
              {deals.map((deal) => (
                <li key={deal.id}>
                  <Link href={`/work/${deal.id}`} className={`${ROW} flex items-center justify-between gap-2 card-hover`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{deal.request?.title}</p>
                      <p className={META}>
                        {fmtDate(deal.created_at)}
                        {deal.work_fee != null && ` · ${fmtWon(deal.work_fee)}`}
                      </p>
                    </div>
                    <StatusBadge kind="deal" status={deal.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 섹션 B — 교육·서비스 신청 현황 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text">교육·서비스 현황</h2>
            <Link href="/matching" className="text-xs font-medium text-accent hover:underline">전체 보기</Link>
          </div>
          {ordersRes.error ? (
            <ErrorState message="교육·서비스 현황을 불러오지 못했습니다." />
          ) : orders.length === 0 ? (
            <EmptyState message="신청한 교육·서비스가 없습니다" action={{ href: '/education', label: '교육 둘러보기' }} />
          ) : (
            <ul className="flex flex-col gap-2">
              {orders.map((order) => (
                <li key={order.id} className={ROW}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{order.package_name}</p>
                      <p className={META}>
                        {fmtDate(order.created_at)}
                        {' · '}
                        {order.price === 0 ? '무료' : fmtWon(order.price)}
                      </p>
                    </div>
                    <StatusBadge kind="order" status={order.status} />
                  </div>
                  {order.status === 'pending' && (
                    <p className="mt-2 text-xs text-info">접수 완료 — 매니저 연락 예정</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 섹션 C — 매칭 현황 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text">매칭 현황</h2>
            <Link href="/matching" className="text-xs font-medium text-accent hover:underline">전체 보기</Link>
          </div>
          {matchingsRes.error ? (
            <ErrorState message="매칭 현황을 불러오지 못했습니다." />
          ) : matchings.length === 0 ? (
            <EmptyState message="매칭 제안이 없습니다" />
          ) : (
            <ul className="flex flex-col gap-2">
              {matchings.map((m) => (
                <li key={m.id}>
                  <Link href={`/matching/${m.id}`} className={`${ROW} flex items-center justify-between gap-2 card-hover`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{m.request?.title}</p>
                      <p className={META}>
                        {fmtDate(m.created_at)}
                        {m.request?.req_type && ` · ${m.request.req_type}`}
                      </p>
                    </div>
                    <StatusBadge kind="matching" status={m.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 섹션 D — 활동 이력 (조회 실패는 섹션을 숨기지 않고 에러 상태로 표시) */}
        {activitiesRes.error ? (
          <section>
            <h2 className="mb-3 text-lg font-serif font-bold text-text">활동 이력</h2>
            <ErrorState message="활동 이력을 불러오지 못했습니다." />
          </section>
        ) : null}
        {!activitiesRes.error && activities.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-serif font-bold text-text">활동 이력</h2>
            <ul className="flex flex-col gap-2">
              {activities.map((a) => {
                const isExpired = a.expires_at && new Date(a.expires_at) < new Date()
                return (
                  <li key={a.id} className={`${ROW} ${isExpired ? 'opacity-50' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text">
                          {ACTIVITY_TYPE_LABELS[a.type] || a.type}
                          <span className="ml-2 text-xs font-bold text-accent tabular-nums">+{a.points}</span>
                        </p>
                        <p className={META}>
                          {fmtDate(a.created_at)}
                          {a.expires_at && ` ~ ${fmtDate(a.expires_at)}`}
                        </p>
                      </div>
                      {isExpired && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-surface px-2 py-0.5 text-xs text-text-subtle">만료</span>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* 섹션 E — 관심 표현 이력 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text">관심 표현 이력</h2>
            <span className="text-xs font-medium text-text-muted tabular-nums">
              활성 {interestsRes.error ? '—' : activeInterestCount}/5개
            </span>
          </div>
          {interestsRes.error ? (
            <ErrorState message="관심 표현 이력을 불러오지 못했습니다." />
          ) : interests.length === 0 ? (
            <EmptyState message="관심 표현 이력이 없습니다" action={{ href: '/requests', label: '공개 의뢰 둘러보기' }} />
          ) : (
            <ul className="flex flex-col gap-2">
              {interests.map((interest) => (
                <li key={interest.id}>
                  <Link href={`/requests/${interest.request.id}`} className={`${ROW} flex items-center justify-between gap-2 card-hover`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{interest.request.title}</p>
                      <p className={META}>{fmtDate(interest.created_at)}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium ${
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
          <Button type="submit" variant="outline" className="w-full text-text-muted">
            로그아웃
          </Button>
        </form>

        {/* 회원 탈퇴 */}
        <DangerZone
          title="시니어지식인 탈퇴"
          description={
            <>
              탈퇴하면 실명·활동명 등 개인정보가 즉시 익명화되며 복구할 수 없습니다. 매칭 후보에서도 제외됩니다.
              기업회원 등 다른 역할로 가입돼 있다면 그 역할은 유지됩니다. 거래·정산 기록은 법령에 따라 5년간 보존됩니다.
            </>
          }
          buttonLabel="시니어지식인 탈퇴"
          confirmMessage="시니어지식인에서 탈퇴합니다. 개인정보가 즉시 익명화되어 복구할 수 없습니다. 계속할까요?"
          action={withdrawExpertSelf}
        />
      </div>
    </div>
  )
}
