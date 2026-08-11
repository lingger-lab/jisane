'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PACKAGE_STATUS_LABELS } from '@jisane/shared/labels'
import { PACKAGE_STATUS_BADGE_CLASSES } from '@jisane/shared/status-badges'
import { ArchiveButton } from './archive-button'

const STATUS_BADGE = PACKAGE_STATUS_BADGE_CLASSES

export interface ServiceItem {
  id: string
  name: string
  price: number
  is_free: boolean
  status: string
  target_audience: string
}

export function ServicesList({ items }: { items: ServiceItem[] }) {
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const filtered = q ? items.filter((p) => p.name.toLowerCase().includes(q)) : items

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
          placeholder="서비스명으로 검색"
          aria-label="서비스 검색"
          className="w-full rounded-xl border border-border-light bg-background py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-subtle focus:border-info focus:ring-1 focus:ring-info/20 focus:outline-none transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">검색 결과가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((pkg) => (
            <div key={pkg.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-light bg-white p-4 shadow-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium text-text">{pkg.name}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[pkg.status] || ''}`}>
                    {PACKAGE_STATUS_LABELS[pkg.status] || pkg.status}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-subtle">
                  {pkg.target_audience === 'owner' ? '기업 대상' : '시니어지식인 대상'} ·{' '}
                  {pkg.is_free ? '무료' : `${pkg.price.toLocaleString('ko-KR')}원`}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/partner/dashboard/services/${pkg.id}`}
                  className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-info/30 hover:text-info"
                >
                  수정
                </Link>
                {pkg.status !== 'archived' && <ArchiveButton packageId={pkg.id} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
