import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { SuccessToast, ErrorToast } from '@jisane/ui/toast'
import type { RequestRow, ServiceOrderRow } from '@jisane/shared/types'
import { REQUEST_STATUS_LABELS, ORDER_STATUS_LABELS } from '@jisane/shared/labels'

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-info-light text-info',
  matching: 'bg-warning-light text-warning',
  dealt: 'bg-success-light text-success',
  closed: 'bg-surface text-text-subtle',
}

const STRIPE_COLORS: Record<string, string> = {
  open: 'border-l-info',
  matching: 'border-l-warning',
  dealt: 'border-l-success',
  closed: 'border-l-border',
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

export default async function StatusPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // client_id 조회
  const { data: client } = await adminClient
    .from('client')
    .select('id, email')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) {
    redirect('/')
  }

  // 의뢰 목록 조회
  const [requestsRes, serviceOrdersRes] = await Promise.all([
    adminClient
      .from('request')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false }),
    adminClient
      .from('service_order')
      .select('*')
      .eq('client_id', client.id)
      .order('created_at', { ascending: false }),
  ])

  const requestList = (requestsRes.data || []) as RequestRow[]
  const serviceOrders = (serviceOrdersRes.data || []) as ServiceOrderRow[]

  const activeCount = requestList.filter((r) => ['open', 'matching', 'dealt'].includes(r.status)).length
  const closedCount = requestList.filter((r) => r.status === 'closed').length

  return (
    <div className="flex flex-1 flex-col px-4 py-5 sm:px-6 sm:py-8 animate-fade-in">
      <Suspense><SuccessToast /><ErrorToast /></Suspense>

      {/* 대시보드 헤더 */}
      <div className="mb-5">
        <p className="text-lg font-bold text-text">안녕하세요</p>
        <p className="text-xs text-text-muted">{client.email} · 지사네 기업공간</p>
      </div>

      {/* 요약 카드 */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border-light bg-surface-warm p-4 text-center">
          <p className="text-2xl font-bold text-primary">{activeCount}</p>
          <p className="text-xs text-text-muted">진행 중 의뢰</p>
        </div>
        <div className="rounded-xl border border-border-light bg-surface-warm p-4 text-center">
          <p className="text-2xl font-bold text-primary">{closedCount}</p>
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

      {requestList.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center py-12">
          <p className="text-text-muted">아직 등록한 의뢰가 없습니다.</p>
          <p className="text-xs text-text-subtle max-w-xs">
            시니어 전문가에게 맡길 작업을 등록하세요.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {requestList.map((req, i) => (
            <li key={req.id} className={`animate-fade-in stagger-${Math.min(i + 1, 5)}`}>
              <Link
                href={`/status/${req.id}`}
                className={`block rounded-xl border border-border-light border-l-4 ${STRIPE_COLORS[req.status] || 'border-l-border'} p-4 shadow-xs card-hover`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium text-text">{req.title}</h3>
                    <p className="mt-1 text-xs text-text-muted">
                      {new Date(req.created_at).toLocaleDateString('ko-KR')}
                      {req.req_type && ` · ${req.req_type}`}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[req.status] || 'bg-surface text-text-subtle'
                    }`}
                  >
                    {REQUEST_STATUS_LABELS[req.status] || req.status}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 전문서비스 현황 */}
      <h2 className="mb-3 mt-8 text-base font-bold text-text">전문서비스 현황</h2>

      {serviceOrders.length === 0 ? (
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
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ORDER_STATUS_COLORS[order.status] || 'bg-surface text-text-subtle'
                    }`}
                  >
                    {ORDER_STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
