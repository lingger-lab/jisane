'use client'

import Link from 'next/link'
import { StatusBadge } from '@jisane/ui/status-badge'
import { PILLAR_LABELS, formatPackagePrice, type EnterprisePillar } from '@jisane/shared/service-catalog'
import { EnterpriseArchiveButton } from './archive-button'

export interface EnterpriseItem {
  id: string
  name: string
  price: number
  is_free: boolean
  status: string
  pillar: EnterprisePillar | null
}

export function EnterpriseServicesList({ items }: { items: EnterpriseItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((pkg) => (
        <div key={pkg.id} className="flex items-center justify-between gap-3 rounded-xl border border-border-light bg-card p-4 shadow-xs">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-text">{pkg.name}</p>
              <StatusBadge kind="package" status={pkg.status} />
            </div>
            <p className="mt-0.5 text-xs text-text-subtle">
              {pkg.pillar ? PILLAR_LABELS[pkg.pillar] : '미분류'} · {formatPackagePrice({ isFree: pkg.is_free, price: pkg.price })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/dashboard/enterprise-services/${pkg.id}`}
              className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
            >
              수정
            </Link>
            {pkg.status !== 'archived' && <EnterpriseArchiveButton id={pkg.id} />}
          </div>
        </div>
      ))}
    </div>
  )
}
