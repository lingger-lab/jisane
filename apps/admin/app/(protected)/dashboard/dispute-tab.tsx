'use client'

import { useState } from 'react'
import { FilterRadioGroup } from '@jisane/ui/filter-radio-group'
import type { DisputeItem } from '@jisane/shared/query-types'
import { DISPUTE_TARGET_LABELS, DISPUTE_RAISED_BY_LABELS } from '@jisane/shared/labels'
import { StatusBadge } from '@jisane/ui/status-badge'
import { resolveDispute } from '@/lib/admin/actions'

interface DisputeTabProps {
  disputes: DisputeItem[]
}

export function DisputeTab({ disputes }: DisputeTabProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')

  const filtered = filter === 'all' ? disputes : disputes.filter((d) => d.status === filter)

  return (
    <div>
      {/* 필터 */}
      <FilterRadioGroup
        options={(['all', 'open', 'resolved'] as const).map((f) => ({
          value: f,
          label: f === 'all' ? '전체' : f === 'open' ? '처리 중' : '해결',
        }))}
        value={filter}
        onChange={setFilter}
        label="이의제기 상태 필터"
        selectOnArrow
        className="mb-4 flex gap-2"
        optionClassName={(selected) =>
          `rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            selected ? 'bg-accent text-white' : 'bg-surface text-text-muted hover:text-text'
          }`
        }
      />

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">이의제기가 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((d) => (
            <DisputeCard key={d.id} dispute={d} />
          ))}
        </ul>
      )}
    </div>
  )
}

function DisputeCard({ dispute }: { dispute: DisputeItem }) {
  const [resolving, setResolving] = useState(false)

  async function handleResolve() {
    setResolving(true)
    await resolveDispute(dispute.id)
    setResolving(false)
  }

  return (
    <li className="rounded-xl border border-border-light p-4 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <StatusBadge kind="dispute" status={dispute.status} />
            <span className="rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted">
              {DISPUTE_TARGET_LABELS[dispute.target_type] || dispute.target_type}
            </span>
            <span className="text-xs text-text-muted">
              제기자: {DISPUTE_RAISED_BY_LABELS[dispute.raised_by] || dispute.raised_by}
            </span>
          </div>
          <p className="text-sm text-text">{dispute.reason}</p>
          <p className="mt-1 text-xs text-text-subtle">
            {new Date(dispute.created_at).toLocaleDateString('ko-KR')}
            {' · '}
            대상 ID: {dispute.target_id.slice(0, 8)}
          </p>
        </div>
        {dispute.status === 'open' && (
          <button
            type="button"
            onClick={handleResolve}
            disabled={resolving}
            className="shrink-0 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-50"
          >
            {resolving ? '처리 중...' : '해결'}
          </button>
        )}
      </div>
    </li>
  )
}
