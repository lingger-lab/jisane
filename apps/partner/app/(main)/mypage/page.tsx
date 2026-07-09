import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signOut } from '@jisane/shared/auth/actions'
import { DEAL_STATUS_LABELS, ORDER_STATUS_LABELS, MATCHING_STATUS_LABELS } from '@jisane/shared/labels'
import { SuccessToast, ErrorToast } from '@jisane/ui/toast'
import { ProfileEditor } from '@/components/profile-editor'

const DEAL_STATUS_COLORS: Record<string, string> = {
  quoted: 'bg-info-light text-info',
  working: 'bg-warning-light text-warning',
  done: 'bg-success-light text-success',
  cancelled: 'bg-error-light text-error',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-info-light text-info',
  paid: 'bg-warning-light text-warning',
  processing: 'bg-success-light text-success',
  completed: 'bg-surface text-text-subtle',
  cancelled: 'bg-error-light text-error',
}

const MATCHING_STATUS_COLORS: Record<string, string> = {
  proposed: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  rejected: 'bg-error-light text-error',
}

export default async function MyPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: partner } = await adminClient
    .from('partner')
    .select('id, name, field, career_yrs, contact, email, grade, created_at')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) redirect('/register')

  // 작업 / 교육서비스 / 매칭 현황 병렬 조회
  const [dealsRes, ordersRes, matchingsRes] = await Promise.all([
    adminClient
      .from('deal')
      .select('id, status, work_fee, created_at, request:request!inner(title)')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('service_order')
      .select('id, package_name, status, created_at, price')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('matching_candidate')
      .select('id, status, created_at, request:request!inner(title, req_type)')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const deals = dealsRes.data || []
  const orders = ordersRes.data || []
  const matchings = matchingsRes.data || []

  const profile = {
    name: partner.name,
    field: partner.field,
    career_yrs: partner.career_yrs,
    contact: partner.contact,
    email: partner.email,
    grade: partner.grade,
    created_at: partner.created_at,
  }

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <Suspense><SuccessToast /><ErrorToast /></Suspense>
      <h1 className="mb-2 text-2xl font-bold text-accent">마이페이지</h1>
      <p className="mb-6 text-sm text-text-muted">
        내 현황을 확인하고 프로필을 수정할 수 있습니다.
      </p>

      {/* 프로필 요약 카드 */}
      <div className="mb-6 rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-lg font-bold text-accent">
            {(partner.name || partner.email)[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-text">{partner.name || '이름 미등록'}</p>
            <p className="text-xs text-text-muted">{partner.email}</p>
          </div>
        </div>
        <div className="mt-3 flex gap-3 text-xs text-text-muted">
          <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-medium text-accent">
            {partner.grade === 'veteran' ? '베테랑' : partner.grade === 'new' ? '신규' : '스탠다드'}
          </span>
          <span>가입: {new Date(partner.created_at).toLocaleDateString('ko-KR')}</span>
        </div>
      </div>

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
            {deals.map((deal: any) => (
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
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${DEAL_STATUS_COLORS[deal.status] || 'bg-surface text-text-subtle'}`}>
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
            {orders.map((order: any) => (
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
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-surface text-text-subtle'}`}>
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
            {matchings.map((m: any) => (
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
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${MATCHING_STATUS_COLORS[m.status] || 'bg-surface text-text-subtle'}`}>
                    {MATCHING_STATUS_LABELS[m.status] || m.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 프로필 편집 */}
      <section className="mb-8">
        <h2 className="mb-4 text-base font-bold text-text">프로필 편집</h2>
        <ProfileEditor profile={profile} />
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
  )
}
