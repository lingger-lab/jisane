'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@jisane/ui/status-badge'
import { ServiceBanner } from '@jisane/ui/service-banner'
import { PILLAR_ORDER, PILLAR_LABELS, formatPackagePrice, JISANE_OFFICIAL_ID, type EnterprisePillar } from '@jisane/shared/service-catalog'
import { setStudioVisibility, setStudioPillar, archiveStudioService } from '@/lib/studio/actions'

export interface StudioServiceItem {
  id: string
  name: string
  status: string
  pillar: EnterprisePillar | null
  visible: boolean
  source_ref: string | null
  provider_id: string
  provider_name: string | null
  banner_url: string | null
  price: number
  is_free: boolean
  target_audience: string
}

export function StudioServicesList({ items }: { items: StudioServiceItem[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map((it) => (
        <li key={it.id}>
          <StudioRow item={it} />
        </li>
      ))}
    </ul>
  )
}

function StudioRow({ item }: { item: StudioServiceItem }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isJisane = item.provider_id === JISANE_OFFICIAL_ID

  async function run(fn: () => Promise<{ error?: string }>) {
    setBusy(true)
    setError(null)
    const r = await fn()
    setBusy(false)
    if (r.error) setError(r.error)
    else router.refresh()
  }

  return (
    <div className="rounded-xl border border-border-light bg-card p-3 shadow-xs">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="w-20 shrink-0">
            <ServiceBanner src={item.banner_url} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-sm font-medium text-text">{item.name}</p>
              <StatusBadge kind="package" status={item.status} />
              {item.source_ref && (
                <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[11px] font-medium text-text-subtle">동기화</span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-text-muted">
              {isJisane ? '지사네 공식' : (item.provider_name ?? '제공자')} · {formatPackagePrice({ isFree: item.is_free, price: item.price })}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => run(() => setStudioVisibility(item.id, !item.visible))}
            disabled={busy}
            aria-pressed={item.visible}
            className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${item.visible ? 'border-primary/30 text-primary hover:bg-primary/5' : 'border-border-light text-text-subtle hover:text-text'}`}
          >
            {item.visible ? '노출 중' : '숨김'}
          </button>
          <Link
            href={`/dashboard/knowledge-studio/${item.id}`}
            className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
          >
            수정
          </Link>
          {item.status !== 'archived' && (
            <button
              type="button"
              onClick={() => run(() => archiveStudioService(item.id))}
              disabled={busy}
              className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-subtle transition-colors hover:border-error/30 hover:text-error disabled:opacity-50"
            >
              보관
            </button>
          )}
        </div>
      </div>

      {/* 5대 지원 매칭 — 오너 대상 서비스만(오너 화면 분류축) */}
      {item.target_audience === 'owner' && (
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border-light pt-3">
          <label htmlFor={`pillar-${item.id}`} className="shrink-0 text-xs text-text-subtle">5대 지원 매칭</label>
          <select
            id={`pillar-${item.id}`}
            value={item.pillar ?? ''}
            onChange={(e) => run(() => setStudioPillar(item.id, (e.target.value || null) as EnterprisePillar | null))}
            disabled={busy}
            className="focus-ring rounded-lg border border-border-light bg-background px-2 py-1 text-xs text-text disabled:opacity-50"
          >
            <option value="">미매칭</option>
            {PILLAR_ORDER.map((code) => (
              <option key={code} value={code}>{PILLAR_LABELS[code]}</option>
            ))}
          </select>
          {error && <span className="text-xs text-error">{error}</span>}
        </div>
      )}
      {error && item.target_audience !== 'owner' && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  )
}
