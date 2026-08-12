'use client'

import { useState } from 'react'
import { FilterRadioGroup } from '@jisane/ui/filter-radio-group'
import { StatusBadge } from '@jisane/ui/status-badge'

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

const FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'invited', label: '대기' },
  { key: 'accepted', label: '수락' },
  { key: 'declined', label: '거절' },
] as const

export function InvitationTab({ invitations }: { invitations: InvitationItem[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['key']>('all')

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
      <FilterRadioGroup
        options={FILTERS.map((f) => ({ value: f.key, label: f.label }))}
        value={filter}
        onChange={setFilter}
        label="초빙 상태 필터"
        selectOnArrow
        className="flex gap-1 overflow-x-auto"
        optionClassName={(selected) =>
          `shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            selected
              ? 'bg-accent text-white'
              : 'bg-surface text-text-muted hover:text-text'
          }`
        }
      />

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
                      {inv.expert.name ?? '시니어지식인'}
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
                <StatusBadge kind="invitation" status={inv.status} className="px-2.5 py-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
