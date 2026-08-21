'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ORDER_STATUS_LABELS } from '@jisane/shared/labels'
import { ORDER_STATUS_BADGE_CLASSES } from '@jisane/shared/status-badges'

const STATUS_BADGE: Record<string, string> = {
  ...ORDER_STATUS_BADGE_CLASSES,
  // 이 화면만 completed에 text-text-muted를 써 온 기존 표시를 보존한다(의도 드리프트 — 색 변경 금지 원칙).
  completed: 'bg-surface text-text-muted',
}

export interface OrderItem {
  id: string
  packageName: string
  orderer: string
  price: number
  isFree: boolean
  status: string
  detail: string | null
  createdAt: string
}

export function OrdersList({ items }: { items: OrderItem[] }) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const filtered = q
    ? items.filter((o) => o.packageName.toLowerCase().includes(q) || o.orderer.toLowerCase().includes(q))
    : items

  return (
    <div>
      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-subtle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.34-4.34m0 0A7 7 0 1 0 6.71 6.71a7 7 0 0 0 9.95 9.95Z" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="서비스명·신청자로 검색"
          aria-label="신청 검색"
          className="w-full rounded-xl border border-border-light bg-background py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-subtle focus:border-partner focus:ring-1 focus:ring-partner/20 focus:outline-none transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">검색 결과가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((o) => (
            <Link
              key={o.id}
              href={`/partner/dashboard/orders/${o.id}`}
              className="block rounded-xl border border-border-light bg-card p-4 shadow-xs card-hover"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text">{o.packageName}</p>
                  <p className="mt-0.5 text-xs text-text-subtle">
                    신청: {o.orderer} · {new Date(o.createdAt).toLocaleDateString('ko-KR')} ·{' '}
                    {o.isFree ? '무료' : `${o.price.toLocaleString('ko-KR')}원`}
                  </p>
                  {o.detail && (
                    <p className="mt-2 rounded-lg bg-surface-warm p-2.5 text-xs text-text-muted line-clamp-2">{o.detail}</p>
                  )}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[o.status] || ''}`}>
                    {ORDER_STATUS_LABELS[o.status] || o.status}
                  </span>
                  {o.status === 'processing' && <span className="text-xs font-medium text-partner">완료 처리 →</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
