import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signOut } from '@jisane/shared/auth/actions'
import { REQUEST_STATUS_LABELS, ORDER_STATUS_LABELS, DEAL_STATUS_LABELS, INVITATION_STATUS_LABELS } from '@jisane/shared/labels'
import {
  REQUEST_STATUS_BADGE_CLASSES,
  ORDER_STATUS_BADGE_CLASSES,
  DEAL_STATUS_BADGE_CLASSES,
  INVITATION_STATUS_BADGE_CLASSES,
} from '@jisane/shared/status-badges'
import { PageHero } from '@jisane/ui/page-hero'
import { ErrorState } from '@jisane/ui/error-state'
import { OwnerProfileForm } from './owner-profile-form'

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

  // 의뢰 / 전문서비스 / 매칭(거래) / 관심표현 / 초빙 / 리뷰 병렬 조회
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
      <PageHero eyebrow="기업회원" title="마이페이지" subtitle="회사 정보를 등록하면 의뢰·매칭이 더 정확해집니다." />

      <div className="responsive-container px-4 md:px-6 py-6">
      {/* 계정 요약 */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {(owner.company || owner.email)[0].toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-text">{owner.email}</p>
          <p className="text-xs text-text-muted">
            가입: {new Date(owner.created_at).toLocaleDateString('ko-KR')}
          </p>
        </div>
      </div>

      {/* 개인정보 수정 */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold text-text">회사 정보</h2>
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
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text">의뢰 현황</h2>
          <Link href="/status" className="text-xs font-medium text-primary hover:underline">전체 보기</Link>
        </div>
        {requestsRes.error ? (
          <ErrorState message="의뢰 현황을 불러오지 못했습니다." />
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">등록된 의뢰가 없습니다</p>
            <Link href="/request" className="text-sm font-medium text-primary hover:underline">의뢰하기</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {requests.map((req) => (
              <li key={req.id}>
                <Link
                  href={`/status/${req.id}`}
                  className="flex items-center justify-between rounded-lg border border-border-light p-3 shadow-xs card-hover"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{req.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(req.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${REQUEST_STATUS_BADGE_CLASSES[req.status] || 'bg-surface text-text-subtle'}`}>
                    {REQUEST_STATUS_LABELS[req.status] || req.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 섹션 B — 전문서비스 현황 */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text">전문서비스 현황</h2>
          <Link href="/status" className="text-xs font-medium text-primary hover:underline">전체 보기</Link>
        </div>
        {ordersRes.error ? (
          <ErrorState message="전문서비스 현황을 불러오지 못했습니다." />
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">신청한 서비스가 없습니다</p>
            <Link href="/services" className="text-sm font-medium text-primary hover:underline">서비스 둘러보기</Link>
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
          <Link href="/status" className="text-xs font-medium text-primary hover:underline">전체 보기</Link>
        </div>
        {dealsRes.error ? (
          <ErrorState message="매칭 현황을 불러오지 못했습니다." />
        ) : deals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">진행 중인 매칭이 없습니다</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {deals.map((deal) => (
              <li key={deal.id}>
                <div className="rounded-lg border border-border-light p-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{deal.request?.title}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {new Date(deal.created_at).toLocaleDateString('ko-KR')}
                        {deal.total_pay != null && ` · ${deal.total_pay.toLocaleString('ko-KR')}원`}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${DEAL_STATUS_BADGE_CLASSES[deal.status] || 'bg-surface text-text-subtle'}`}>
                      {DEAL_STATUS_LABELS[deal.status] || deal.status}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 섹션 D — 받은 관심표현 */}
      <section className="mb-6">
        <h2 className="mb-3 text-base font-bold text-text">받은 관심표현</h2>
        {interestsRes.error ? (
          <ErrorState message="받은 관심표현을 불러오지 못했습니다." />
        ) : interests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">시니어지식인의 관심 표현이 없습니다</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {interests.map((interest) => (
              <li key={interest.id} className="rounded-lg border border-border-light p-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text">
                      {interest.expert.name || '이름 미등록'}
                      <span className="ml-1.5 text-xs text-text-muted">{interest.expert.field}</span>
                    </p>
                    <p className="mt-0.5 truncate text-xs text-text-muted">
                      {interest.request.title}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-text-subtle">
                    {new Date(interest.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                {interest.note && (
                  <p className="mt-2 text-xs text-text-muted">{interest.note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 섹션 E — 초빙 이력 */}
      <section className="mb-6">
        <h2 className="mb-3 text-base font-bold text-text">초빙 이력</h2>
        {invitationsRes.error ? (
          <ErrorState message="초빙 이력을 불러오지 못했습니다." />
        ) : invitations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">초빙 이력이 없습니다</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {invitations.map((inv) => (
              <li key={inv.id} className="rounded-lg border border-border-light p-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">
                      {inv.expert.name || '이름 미등록'}
                      <span className="ml-1.5 text-xs text-text-muted">{inv.expert.field}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(inv.created_at).toLocaleDateString('ko-KR')}
                      {inv.cap_amount != null && ` · 상한 ${inv.cap_amount.toLocaleString('ko-KR')}원`}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${INVITATION_STATUS_BADGE_CLASSES[inv.status] || 'bg-surface text-text-subtle'}`}>
                    {INVITATION_STATUS_LABELS[inv.status] || inv.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 섹션 F — 쓴 리뷰 */}
      <section className="mb-8">
        <h2 className="mb-3 text-base font-bold text-text">내가 쓴 리뷰</h2>
        {reviewsRes.error ? (
          <ErrorState message="작성한 리뷰를 불러오지 못했습니다." />
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">작성한 리뷰가 없습니다</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-lg border border-border-light p-3 shadow-xs">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text">{review.deal.request.title}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {new Date(review.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-warning">
                    {'★'.repeat(review.rating || 0)}
                    <span className="text-border-light">{'★'.repeat(5 - (review.rating || 0))}</span>
                  </span>
                </div>
                {review.comment && (
                  <p className="mt-2 text-xs text-text-muted">{review.comment}</p>
                )}
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
