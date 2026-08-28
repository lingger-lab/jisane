'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@jisane/ui/status-badge'
import { PILLAR_ORDER, PILLAR_LABELS, formatPackagePrice, type EnterprisePillar } from '@jisane/shared/service-catalog'
import { setEnterpriseVisibility, setEnterprisePillar } from '@/lib/enterprise/actions'
import { EnterpriseArchiveButton } from './archive-button'

export interface EnterpriseItem {
  id: string
  name: string
  price: number
  is_free: boolean
  status: string
  pillar: EnterprisePillar | null
  visible: boolean
  source_ref: string | null
}

export function EnterpriseServicesList({ items }: { items: EnterpriseItem[] }) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((pkg) => (
        <EnterpriseRow key={pkg.id} pkg={pkg} />
      ))}
    </div>
  )
}

function EnterpriseRow({ pkg }: { pkg: EnterpriseItem }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isSynced = !!pkg.source_ref

  async function toggleVisible() {
    setBusy(true)
    setError(null)
    const r = await setEnterpriseVisibility(pkg.id, !pkg.visible)
    setBusy(false)
    if (r.error) setError(r.error)
    else router.refresh()
  }

  async function changePillar(value: string) {
    setBusy(true)
    setError(null)
    const r = await setEnterprisePillar(pkg.id, (value || null) as EnterprisePillar | null)
    setBusy(false)
    if (r.error) setError(r.error)
    else router.refresh()
  }

  return (
    <div className="rounded-xl border border-border-light bg-card p-4 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-text">{pkg.name}</p>
            <StatusBadge kind="package" status={pkg.status} />
            {isSynced && (
              <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[11px] font-medium text-text-subtle">동기화</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-subtle">
            {formatPackagePrice({ isFree: pkg.is_free, price: pkg.price })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {/* 노출 토글 — 오너 화면·공개 허브 노출 on/off(동기화 보존) */}
          <button
            type="button"
            onClick={toggleVisible}
            disabled={busy}
            aria-pressed={pkg.visible}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
              pkg.visible
                ? 'border-primary/30 text-primary hover:bg-primary/5'
                : 'border-border-light text-text-subtle hover:text-text'
            }`}
          >
            {pkg.visible ? '노출 중' : '숨김'}
          </button>
          <Link
            href={`/dashboard/enterprise-services/${pkg.id}`}
            className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
          >
            수정
          </Link>
          {pkg.status !== 'archived' && <EnterpriseArchiveButton id={pkg.id} />}
        </div>
      </div>

      {/* 5대 지원 매칭 — 오너 화면 분류(미매칭이면 검색·허브만 노출) */}
      <div className="mt-3 flex items-center gap-2 border-t border-border-light pt-3">
        <label htmlFor={`pillar-${pkg.id}`} className="text-xs text-text-subtle">
          5대 지원 매칭
        </label>
        <select
          id={`pillar-${pkg.id}`}
          value={pkg.pillar ?? ''}
          onChange={(e) => changePillar(e.target.value)}
          disabled={busy}
          className="focus-ring rounded-lg border border-border-light bg-background px-2 py-1 text-xs text-text disabled:opacity-50"
        >
          <option value="">미매칭</option>
          {PILLAR_ORDER.map((code) => (
            <option key={code} value={code}>
              {PILLAR_LABELS[code]}
            </option>
          ))}
        </select>
        {error && <span className="text-xs text-error">{error}</span>}
      </div>
    </div>
  )
}
