'use client'

import { useState } from 'react'

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
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: '접수', color: 'bg-blue-100 text-blue-700' },
  paid: { label: '결제 완료', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '진행 중', color: 'bg-green-100 text-green-700' },
  completed: { label: '완료', color: 'bg-gray-100 text-gray-600' },
  cancelled: { label: '취소', color: 'bg-red-100 text-red-700' },
}

const CATEGORY_LABELS: Record<string, string> = {
  ax_consulting: 'AX 컨설팅',
  biz_consulting: '경영 컨설팅',
  education: '교육',
}

const STATUS_OPTIONS = ['pending', 'paid', 'processing', 'completed', 'cancelled']

export function ServiceTab({ orders }: { orders: ServiceOrderItem[] }) {
  const [items, setItems] = useState(orders)
  const [updating, setUpdating] = useState<string | null>(null)

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdating(orderId)
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
      }
    } finally {
      setUpdating(null)
    }
  }

  if (items.length === 0) {
    return <p className="py-8 text-center text-sm text-text-muted">서비스 주문이 없습니다.</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((order) => {
        const statusInfo = STATUS_LABELS[order.status] || STATUS_LABELS.pending
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
                    {order.client_id ? '기업' : '시니어'}
                  </span>
                  <span>
                    {order.price === 0 ? '무료' : `${order.price.toLocaleString('ko-KR')}원`}
                  </span>
                  <span>{new Date(order.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
                {order.detail && (
                  <p className="mt-2 text-xs text-text-muted">{order.detail}</p>
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
                  className="rounded border border-border bg-background px-2 py-1 text-xs text-text disabled:opacity-50"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]?.label || s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
