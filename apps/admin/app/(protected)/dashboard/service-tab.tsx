'use client'

import { useState } from 'react'
import { getPackageBySlug } from '@jisane/shared/service-catalog'

interface ServiceOrderItem {
  id: string
  category: string
  package_slug: string
  package_name: string
  price: number
  status: string
  detail: string | null
  created_at: string
  client_id: string | null
  partner_id: string | null
  client: { company: string | null; ceo_name: string | null; email: string; contact: string | null } | null
  partner: { name: string | null; email: string; contact: string | null } | null
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '접수', color: 'bg-info-light text-info' },
  paid: { label: '결제 완료', color: 'bg-warning-light text-warning' },
  processing: { label: '진행 중', color: 'bg-success-light text-success' },
  completed: { label: '완료', color: 'bg-surface text-text-muted' },
  cancelled: { label: '취소', color: 'bg-error-light text-error' },
}

const CATEGORY_LABELS: Record<string, string> = {
  ax_consulting: 'AX 컨설팅',
  biz_consulting: '경영 컨설팅',
  education: '교육',
}

const CATEGORY_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'ax_consulting', label: 'AX 컨설팅' },
  { key: 'biz_consulting', label: '경영 컨설팅' },
  { key: 'education', label: '교육' },
] as const

const STATUS_OPTIONS = ['pending', 'paid', 'processing', 'completed', 'cancelled']

export function ServiceTab({ orders }: { orders: ServiceOrderItem[] }) {
  const [items, setItems] = useState(orders)
  const [updating, setUpdating] = useState<string | null>(null)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = categoryFilter === 'all'
    ? items
    : items.filter((o) => o.category === categoryFilter)

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdating(orderId)
    setUpdateError(null)
    try {
      const res = await fetch('/api/admin/service-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      })
      if (res.ok) {
        setItems((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        )
      } else {
        setUpdateError('상태 변경에 실패했습니다. 다시 시도해 주세요.')
      }
    } catch {
      setUpdateError('네트워크 오류가 발생했습니다. 연결을 확인해 주세요.')
    } finally {
      setUpdating(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-12 text-center">
        <span className="text-2xl">&#128230;</span>
        <p className="text-sm text-text-muted">서비스 주문이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {updateError && <p className="text-xs text-error">{updateError}</p>}

      {/* 카테고리 필터 */}
      <div className="flex gap-1 overflow-x-auto">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setCategoryFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              categoryFilter === f.key
                ? 'bg-accent text-white'
                : 'bg-surface text-text-muted hover:text-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-1 py-12 text-center">
          <span className="text-2xl">&#128230;</span>
          <p className="text-sm text-text-muted">해당 카테고리의 주문이 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending
            const pkg = getPackageBySlug(order.package_slug)
            const isExpanded = expandedId === order.id

            return (
              <div key={order.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-text">{order.package_name}</h3>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-text-muted">
                      <span className="rounded bg-surface px-2 py-0.5">
                        {CATEGORY_LABELS[order.category] || order.category}
                      </span>
                      <span className="rounded bg-surface px-2 py-0.5">
                        {order.client
                          ? (order.client.company || order.client.ceo_name || '기업')
                          : order.partner
                            ? (order.partner.name || '시니어')
                            : (order.client_id ? '기업' : '시니어')}
                      </span>
                      <span>
                        {order.price === 0 ? '무료' : `${order.price.toLocaleString('ko-KR')}원`}
                      </span>
                      {pkg?.duration && <span>소요: {pkg.duration}</span>}
                      <span>{new Date(order.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                    {order.detail && (
                      <p className="mt-2 text-xs text-text-muted">{order.detail}</p>
                    )}
                    {(order.client || order.partner) && (
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-xs text-text-subtle">
                        {order.client && (
                          <>
                            {order.client.contact && (
                              <a href={`tel:${order.client.contact}`} className="rounded px-1 py-0.5 hover:text-accent hover:bg-accent/5 transition-colors">{order.client.contact}</a>
                            )}
                            <a href={`mailto:${order.client.email}`} className="rounded px-1 py-0.5 hover:text-accent hover:bg-accent/5 transition-colors">{order.client.email}</a>
                          </>
                        )}
                        {order.partner && (
                          <>
                            {order.partner.contact && (
                              <a href={`tel:${order.partner.contact}`} className="rounded px-1 py-0.5 hover:text-accent hover:bg-accent/5 transition-colors">{order.partner.contact}</a>
                            )}
                            <a href={`mailto:${order.partner.email}`} className="rounded px-1 py-0.5 hover:text-accent hover:bg-accent/5 transition-colors">{order.partner.email}</a>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      aria-label="주문 상태 변경"
                      className="rounded border border-border bg-surface px-2 py-1 text-xs text-text disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]?.label || s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 패키지 상세 (제공 내용) */}
                {pkg && pkg.deliverables.length > 0 && (
                  <div className="mt-3 border-t border-border pt-3">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                    >
                      {isExpanded ? '제공 내용 접기' : '제공 내용 보기'}
                    </button>
                    {isExpanded && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {pkg.deliverables.map((d) => (
                          <li key={d} className="flex items-start gap-1.5 text-xs text-text-muted">
                            <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent/40" />
                            {d}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
