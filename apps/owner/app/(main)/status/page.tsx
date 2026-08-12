import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { RequestRow, ServiceOrderRow } from '@jisane/shared/types'
import { PageHero } from '@jisane/ui/page-hero'
import { ErrorState } from '@jisane/ui/error-state'
import { StatusBadge } from '@jisane/ui/status-badge'

export default async function StatusPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // owner_id 조회
  const { data: owner } = await adminClient
    .from('owner')
    .select('id, email')
    .eq('auth_user_id', user.id)
    .single()

  if (!owner) {
    redirect('/')
  }

  // 의뢰 목록 조회
  const [requestsRes, serviceOrdersRes] = await Promise.all([
    adminClient
      .from('request')
      .select('*')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false }),
    adminClient
      .from('service_order')
      .select('*')
      .eq('owner_id', owner.id)
      .order('created_at', { ascending: false }),
  ])

  // 쿼리 실패는 빈 상태가 아니라 섹션별 에러 상태로 렌더한다(감사 docs/11 P2-43).
  if (requestsRes.error) {
    console.error('[status] 의뢰 목록 조회 실패:', requestsRes.error)
  }
  if (serviceOrdersRes.error) {
    console.error('[status] 전문서비스 주문 조회 실패:', serviceOrdersRes.error)
  }
  const requestsFailed = Boolean(requestsRes.error)
  const ordersFailed = Boolean(serviceOrdersRes.error)

  const requestList = (requestsRes.data || []) as RequestRow[]
  const serviceOrders = (serviceOrdersRes.data || []) as ServiceOrderRow[]

  const activeCount = requestList.filter((r) => ['open', 'matching', 'dealt'].includes(r.status)).length
  const closedCount = requestList.filter((r) => r.status === 'closed').length

  return (
    <div className="flex flex-1 flex-col animate-fade-in">

      <PageHero eyebrow="기업회원" title="의뢰 현황" subtitle="등록한 의뢰와 전문서비스 진행 상태를 한눈에 확인하세요." />

      <div className="container-app px-4 md:px-6 py-6">
      {/* 요약 카드 — 조회 실패 시 가짜 0 대신 미확인 표시 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border-light bg-surface-warm p-4 text-center">
          <p className="text-2xl font-bold text-primary tabular-nums">{requestsFailed ? '—' : activeCount}</p>
          <p className="text-xs text-text-muted">진행 중 의뢰</p>
        </div>
        <div className="rounded-xl border border-border-light bg-surface-warm p-4 text-center">
          <p className="text-2xl font-bold text-primary tabular-nums">{requestsFailed ? '—' : closedCount}</p>
          <p className="text-xs text-text-muted">완료된 의뢰</p>
        </div>
      </div>

      {/* 새 의뢰 CTA */}
      <Link
        href="/request"
        className="mb-6 flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
      >
        + 새 의뢰 등록
      </Link>

      {/* 의뢰 리스트 */}
      <h2 className="mb-3 text-base font-bold text-text">의뢰 현황</h2>

      {requestsFailed ? (
        <ErrorState message="의뢰 목록을 불러오지 못했습니다." />
      ) : requestList.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center py-12">
          <p className="text-text-muted">아직 등록한 의뢰가 없습니다.</p>
          <p className="text-xs text-text-subtle max-w-xs">
            시니어지식인에게 맡길 작업을 등록하세요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {requestList.map((req, i) => (
            <li key={req.id} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
              <Link
                href={`/status/${req.id}`}
                className="block rounded-xl border border-border-light bg-surface-warm p-4 shadow-xs card-hover"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-text">{req.title}</h3>
                    <p className="mt-1 text-xs text-text-muted tabular-nums">
                      {new Date(req.created_at).toLocaleDateString('ko-KR')}
                      {req.req_type && ` · ${req.req_type}`}
                    </p>
                  </div>
                  <StatusBadge kind="request" status={req.status} className="px-2.5" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 전문서비스 현황 */}
      <h2 className="mb-3 mt-8 text-base font-bold text-text">전문서비스 현황</h2>

      {ordersFailed ? (
        <ErrorState message="전문서비스 주문 목록을 불러오지 못했습니다." />
      ) : serviceOrders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light py-8 text-center">
          <p className="text-sm text-text-muted">신청한 전문서비스가 없습니다.</p>
          <Link
            href="/services"
            className="text-sm font-medium text-primary hover:underline"
          >
            서비스 둘러보기
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {serviceOrders.map((order, i) => (
            <li key={order.id} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
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
                {order.status === 'pending' && (
                  <p className="mt-2 text-xs text-info">접수 완료 — 담당 매니저가 확인 후 연락드리겠습니다.</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      </div>
    </div>
  )
}
