'use client'

import { useState } from 'react'
import { updateEventReferralStatus } from '@/lib/event/actions'

export interface EventReferralItem {
  id: string
  referrer_name: string
  referrer_contact: string
  referrer_email: string | null
  referee_name: string
  referee_contact: string
  note: string | null
  status: string
  created_at: string
}

const STATUS: Record<string, { label: string; color: string }> = {
  submitted: { label: '접수', color: 'bg-surface text-text-muted' },
  valid: { label: '유효', color: 'bg-primary/10 text-primary' },
  paid: { label: '지급완료', color: 'bg-accent/10 text-accent' },
  rejected: { label: '반려', color: 'bg-error-light text-error' },
}
const STATUS_STEPS = [
  { value: 'submitted', label: '접수' },
  { value: 'valid', label: '유효' },
  { value: 'paid', label: '지급완료' },
  { value: 'rejected', label: '반려' },
]

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('ko-KR')
}

export function EventReferralsList({ items }: { items: EventReferralItem[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function setStatus(id: string, status: string) {
    setBusy(id)
    setError(null)
    const r = await updateEventReferralStatus(id, status)
    if (r.error) setError(r.error)
    setBusy(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-xs text-error">{error}</p>}
      {items.map((it) => {
        const badge = STATUS[it.status] || STATUS.submitted
        return (
          <div key={it.id} className="rounded-lg border border-border-light bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-text">
                  {it.referrer_name} <span className="text-text-subtle">&rarr;</span> {it.referee_name}
                </p>
                <p className="mt-0.5 text-xs text-text-subtle">
                  추천인 {it.referrer_contact}
                  {it.referrer_email ? ` · ${it.referrer_email}` : ''} · 추천대상 {it.referee_contact}
                </p>
                {it.note && <p className="mt-1 text-xs text-text-muted">메모: {it.note}</p>}
                <p className="mt-1 text-xs tabular-nums text-text-subtle">접수 {fmtDate(it.created_at)}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {STATUS_STEPS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  disabled={busy === it.id || it.status === s.value}
                  onClick={() => setStatus(it.id, s.value)}
                  className={`rounded-lg border px-2.5 py-1 text-xs transition-colors disabled:opacity-40 ${
                    it.status === s.value
                      ? 'border-primary/30 text-primary'
                      : 'border-border-light text-text-muted hover:text-text'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
