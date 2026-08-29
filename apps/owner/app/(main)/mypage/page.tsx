import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signOut } from '@jisane/shared/auth/actions'
import { PageHero } from '@jisane/ui/page-hero'
import { ErrorState } from '@jisane/ui/error-state'
import { EmptyState } from '@jisane/ui/empty-state'
import { StatusBadge } from '@jisane/ui/status-badge'
import { StarRating } from '@jisane/ui/star-rating'
import { DangerZone } from '@jisane/ui/danger-zone'
import { Button } from '@jisane/ui/button'
import { Avatar } from '@jisane/ui/avatar'
import { OwnerProfileForm } from './owner-profile-form'
import { withdrawOwnerSelf } from '@/lib/profile/actions'

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

export default async function OwnerMyPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: owner } = await adminClient
    .from('owner')
    .select('id, email, created_at, company, ceo_name, contact, region, industry')
    .eq('auth_user_id', user.id)
    .single()

  if (!owner) redirect('/')

  // 의뢰 / 전문서비스 / 거래 / 관심표현 / 초빙 / 리뷰 병렬 조회
  const [requestsRes, ordersRes, dealsRes, interestsRes, invitationsRes, reviewsRes] = await Promise.all([
    adminClient
      .from('request')
      .select('id, title, status, created_at')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('service_order')
      .select('id, package_name, status, created_at, price')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('deal')
      .select('id, status, total_pay, created_at, request:request!inner(title, owner_id)')
      .eq('request.owner_id', owner.id)
      .order('created_at', { ascending: false })
      .limit(5),
    // 받은 관심표현
    adminClient
      .from('expert_interest')
      .select('id, note, created_at, request:request!inner(id, title, owner_id), expert:expert!inner(id, name, field)')
      .eq('request.owner_id', owner.id)
      .order('created_at', { ascending: false })
      .limit(5),
    // 초빙 이력
    adminClient
      .from('invitation')
      .select('id, status, est_hours, est_amount, cap_amount, created_at, expert:expert!inner(id, name, field), request:request(id, title)')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false })
      .limit(5),
    // 쓴 리뷰
    adminClient
      .from('review')
      .select('id, rating, comment, created_at, deal:deal!inner(id, request:request!inner(id, title, owner_id))')
      .eq('author_type', 'owner')
      .eq('deal.request.owner_id', owner.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  // 쿼리 실패는 서버에 기록하고, 해당 섹션만 빈 상태 대신 에러 상태로 렌더한다(감사 docs/10 P2-35).
  if (requestsRes.error) console.error('[owner/mypage] request query failed:', requestsRes.error.message)
  if (ordersRes.error) console.error('[owner/mypage] service_order query failed:', ordersRes.error.message)
  if (dealsRes.error) console.error('[owner/mypage] deal query failed:', dealsRes.error.message)
  if (interestsRes.error) console.error('[owner/mypage] expert_interest query failed:', interestsRes.error.message)
  if (invitationsRes.error) console.error('[owner/mypage] invitation query failed:', invitationsRes.error.message)
  if (reviewsRes.error) console.error('[owner/mypage] review query failed:', reviewsRes.error.message)

  const requests = (requestsRes.data || []) as Array<{
    id: string; title: string; status: string; created_at: string
  }>
  const orders = (ordersRes.data || []) as Array<{
    id: string; package_name: string; status: string; created_at: string; price: number
  }>
  const deals = (dealsRes.data || []) as unknown as Array<{
    id: string; status: string; total_pay: number | null; created_at: string
    request: { title: string; owner_id: string } | null
  }>
  const interests = (interestsRes.data || []) as unknown as Array<{
    id: string; note: string | null; created_at: string
    request: { id: string; title: string; owner_id: string }
    expert: { id: string; name: string | null; field: string | null }
  }>
  const invitations = (invitationsRes.data || []) as unknown as Array<{
    id: string; status: string; est_hours: number | null; est_amount: number | null; cap_amount: number | null; created_at: string
    expert: { id: string; name: string | null; field: string | null }
    request: { id: string; title: string } | null
  }>
  const reviews = (reviewsRes.data || []) as unknown as Array<{
    id: string; rating: number | null; comment: string | null; created_at: string
    deal: { id: string; request: { id: string; title: string; owner_id: string } }
  }>

  return (
    <div className="flex flex-1 flex-col animate-fade-in">
      <PageHero eyebrow="기업회원" title="마이페이지" subtitle="회사 정보를 등록하면 의뢰·연결이 더 정확해집니다." />

      <div className="container-app flex flex-col gap-8 px-4 md:px-6 py-6">
        {/* 계정 요약 */}
        <div className="flex items-center gap-3 rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
          <Avatar id={owner.id} name={owner.company || owner.email} size="md" />
          <div className="min-w-0">
            <p className="truncate font-medium text-text">{owner.email}</p>
            <p className="text-xs text-text-muted tabular-nums">가입: {fmtDate(owner.created_at)}</p>
          </div>
        </div>

        {/* 회사 정보 */}
        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">회사 정보</h2>
          <OwnerProfileForm
            defaults={{
              company: owner.company ?? '',
              ceo_name: owner.ceo_name ?? '',
              contact: owner.contact ?? '',
              region: owner.region ?? '',
              industry: owner.industry ?? '',
            }}
          />
        </section>

        {/* 섹션 A — 의뢰 현황 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text">의뢰 현황</h2>
            <Link href="/status" className="text-xs font-medium text-primary hover:underline">전체 보기</Link>
          </div>
          {requestsRes.error ? (
            <ErrorState message="의뢰 현황을 불러오지 못했습니다." />
          ) : requests.length === 0 ? (
            <EmptyState message="등록된 의뢰가 없습니다" action={{ href: '/request', label: '의뢰하기' }} />
          ) : (
            <ul className="flex flex-col gap-2">
              {requests.map((req) => (
                <li key={req.id}>
                  <Link href={`/status/${req.id}`} className={`${ROW} flex items-center justify-between gap-2 card-hover`}>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{req.title}</p>
                      <p className={META}>{fmtDate(req.created_at)}</p>
                    </div>
                    <StatusBadge kind="request" status={req.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 섹션 B — 전문서비스 현황 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text">전문서비스 현황</h2>
            <Link href="/status" className="text-xs font-medium text-primary hover:underline">전체 보기</Link>
          </div>
          {ordersRes.error ? (
            <ErrorState message="전문서비스 현황을 불러오지 못했습니다." />
          ) : orders.length === 0 ? (
            <EmptyState message="신청한 서비스가 없습니다" action={{ href: '/services', label: '서비스 둘러보기' }} />
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

        {/* 섹션 C — 거래 현황 */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-serif font-bold text-text">거래 현황</h2>
            <Link href="/status" className="text-xs font-medium text-primary hover:underline">전체 보기</Link>
          </div>
          {dealsRes.error ? (
            <ErrorState message="거래 현황을 불러오지 못했습니다." />
          ) : deals.length === 0 ? (
            <EmptyState message="진행 중인 거래가 없습니다" />
          ) : (
            <ul className="flex flex-col gap-2">
              {deals.map((deal) => (
                <li key={deal.id} className={ROW}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{deal.request?.title}</p>
                      <p className={META}>
                        {fmtDate(deal.created_at)}
                        {deal.total_pay != null && ` · ${fmtWon(deal.total_pay)}`}
                      </p>
                    </div>
                    <StatusBadge kind="deal" status={deal.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 섹션 D — 받은 관심표현 */}
        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">받은 관심표현</h2>
          {interestsRes.error ? (
            <ErrorState message="받은 관심표현을 불러오지 못했습니다." />
          ) : interests.length === 0 ? (
            <EmptyState message="시니어지식인의 관심 표현이 없습니다" />
          ) : (
            <ul className="flex flex-col gap-2">
              {interests.map((interest) => (
                <li key={interest.id} className={ROW}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text">
                        {interest.expert.name || '이름 미등록'}
                        <span className="ml-1.5 text-xs text-text-muted">{interest.expert.field}</span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-text-muted">{interest.request.title}</p>
                    </div>
                    <span className="shrink-0 text-xs text-text-subtle tabular-nums">{fmtDate(interest.created_at)}</span>
                  </div>
                  {interest.note && <p className="mt-2 text-xs text-text-muted">{interest.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 섹션 E — 초빙 이력 */}
        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">초빙 이력</h2>
          {invitationsRes.error ? (
            <ErrorState message="초빙 이력을 불러오지 못했습니다." />
          ) : invitations.length === 0 ? (
            <EmptyState message="초빙 이력이 없습니다" />
          ) : (
            <ul className="flex flex-col gap-2">
              {invitations.map((inv) => (
                <li key={inv.id} className={ROW}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">
                        {inv.expert.name || '이름 미등록'}
                        <span className="ml-1.5 text-xs text-text-muted">{inv.expert.field}</span>
                      </p>
                      <p className={META}>
                        {fmtDate(inv.created_at)}
                        {inv.cap_amount != null && ` · 상한 ${fmtWon(inv.cap_amount)}`}
                      </p>
                    </div>
                    <StatusBadge kind="invitation" status={inv.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 섹션 F — 쓴 리뷰 */}
        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">내가 쓴 리뷰</h2>
          {reviewsRes.error ? (
            <ErrorState message="작성한 리뷰를 불러오지 못했습니다." />
          ) : reviews.length === 0 ? (
            <EmptyState message="작성한 리뷰가 없습니다" />
          ) : (
            <ul className="flex flex-col gap-2">
              {reviews.map((review) => (
                <li key={review.id} className={ROW}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{review.deal.request.title}</p>
                      <p className={META}>{fmtDate(review.created_at)}</p>
                    </div>
                    <StarRating value={review.rating || 0} className="shrink-0" />
                  </div>
                  {review.comment && <p className="mt-2 text-xs text-text-muted">{review.comment}</p>}
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
          title="기업회원 탈퇴"
          description={
            <>
              탈퇴하면 회사 정보가 즉시 익명화되며 복구할 수 없습니다. 시니어지식인·전문가 등 다른 역할로 가입돼
              있다면 그 역할은 유지됩니다. 거래·정산 기록은 관련 법령에 따라 5년간 보존됩니다.
            </>
          }
          buttonLabel="기업회원 탈퇴"
          confirmMessage="기업회원에서 탈퇴합니다. 회사 정보가 즉시 익명화되어 복구할 수 없습니다. 계속할까요?"
          action={withdrawOwnerSelf}
        />
      </div>
    </div>
  )
}
