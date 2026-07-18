'use client'

import { useState } from 'react'
import { INVITATION_STATUS_LABELS } from '@jisane/shared/labels'

interface InvitationItem {
  id: string
  status: string
  est_hours: number | null
  est_amount: number | null
  cap_amount: number | null
  created_at: string
  owner: { id: string; company: string | null; ceo_name: string | null; email: string }
  expert: { id: string; name: string | null; field: string | null }
  request: { id: string; title: string } | null
}

const STATUS_COLORS: Record<string, string> = {
  invited: 'bg-info-light text-info',
  accepted: 'bg-success-light text-success',
  declined: 'bg-error-light text-error',
}

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'invited', label: '대기' },
  { key: 'accepted', label: '수락' },
  { key: 'declined', label: '거절' },
] as const

export function InvitationTab({ invitations }: { invitations: InvitationItem[] }) {
  const [filter, setFilter] = useState('all')

  const filtered = filter === 'all'
    ? invitations
    : invitations.filter((inv) => inv.status === filter)

  if (invitations.length === 0) {
    return (
      <div className="flex flex-col items-center gap-1 py-12 text-center">
        <span className="text-2xl">&#128276;</span>
        <p className="text-sm text-text-muted">초빙 기록이 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 상태 필터 */}
      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? 'bg-accent text-white'
                : 'bg-surface text-text-muted hover:text-text'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">해당 상태의 초빙이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((inv) => (
            <div key={inv.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text">
                      {inv.owner.company ?? inv.owner.ceo_name ?? inv.owner.email}
                    </span>
                    <span className="text-text-subtle">&rarr;</span>
                    <span className="font-medium text-text">
                      {inv.expert.name ?? '전문가'}
                    </span>
                  </div>
                  {inv.expert.field && (
                    <p className="mt-0.5 text-xs text-text-muted">{inv.expert.field}</p>
                  )}
                  {inv.request && (
                    <p className="mt-0.5 text-xs text-text-subtle">의뢰: {inv.request.title}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-text-subtle">
                    <span>{new Date(inv.created_at).toLocaleDateString('ko-KR')}</span>
                    <a href={`mailto:${inv.owner.email}`} className="hover:text-accent transition-colors">{inv.owner.email}</a>
                    {inv.cap_amount != null && (
                      <span className="font-medium text-accent">
                        {inv.est_hours}h · {inv.cap_amount.toLocaleString('ko-KR')}원
                      </span>
                    )}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[inv.status] ?? 'bg-surface text-text-subtle'}`}>
                  {INVITATION_STATUS_LABELS[inv.status] ?? inv.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
