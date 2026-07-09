import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signOut } from '@jisane/shared/auth/actions'
import { REQUEST_STATUS_LABELS, ORDER_STATUS_LABELS, DEAL_STATUS_LABELS } from '@jisane/shared/labels'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-info-light text-info',
  matching: 'bg-warning-light text-warning',
  dealt: 'bg-success-light text-success',
  closed: 'bg-surface text-text-subtle',
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-info-light text-info',
  paid: 'bg-warning-light text-warning',
  processing: 'bg-success-light text-success',
  completed: 'bg-surface text-text-subtle',
  cancelled: 'bg-error-light text-error',
}

const DEAL_STATUS_COLORS: Record<string, string> = {
  quoted: 'bg-info-light text-info',
  working: 'bg-warning-light text-warning',
  done: 'bg-success-light text-success',
  cancelled: 'bg-error-light text-error',
}

export default async function OwnerMyPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: client } = await adminClient
    .from('client')
    .select('id, email, created_at')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) redirect('/')

  // 의뢰 / 전문서비스 / 매칭(거래) 현황 병렬 조회
  const [requestsRes, ordersRes, dealsRes] = await Promise.all([
    adminClient
      .from('request')
      .select('id, title, status, created_at')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('service_order')
      .select('id, package_name, status, created_at, price')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(5),
    adminClient
      .from('deal')
      .select('id, status, work_fee, created_at, request:request!inner(title, client_id)')
      .eq('request.client_id', client.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const requests = requestsRes.data || []
  const orders = ordersRes.data || []
  const deals = dealsRes.data || []

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <h1 className="mb-2 text-2xl font-bold text-primary">마이페이지</h1>
      <p className="mb-6 text-sm text-text-muted">
        계정 정보와 신청 현황을 확인할 수 있습니다.
      </p>

      {/* 프로필 카드 */}
      <div className="mb-8 rounded-xl border border-border-light bg-surface-warm p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {client.email[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-text">{client.email}</p>
            <p className="text-xs text-text-muted">
              가입: {new Date(client.created_at).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>
      </div>

      {/* 섹션 A — 의뢰 현황 */}
      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-text">의뢰 현황</h2>
          <Link href="/status" className="text-xs font-medium text-primary hover:underline">전체 보기</Link>
        </div>
        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">등록된 의뢰가 없습니다</p>
            <Link href="/request" className="text-sm font-medium text-primary hover:underline">의뢰하기</Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {requests.map((req: any) => (
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
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[req.status] || 'bg-surface text-text-subtle'}`}>
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
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">신청한 서비스가 없습니다</p>
            <Link href="/services" className="text-sm font-medium text-primary hover:underline">서비스 둘러보기</Link>
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
          <Link href="/status" className="text-xs font-medium text-primary hover:underline">전체 보기</Link>
        </div>
        {deals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
            <p className="text-sm text-text-muted">진행 중인 매칭이 없습니다</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {deals.map((deal: any) => (
              <li key={deal.id}>
                <div className="rounded-lg border border-border-light p-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
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
                  </div>
                </div>
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
  )
}
