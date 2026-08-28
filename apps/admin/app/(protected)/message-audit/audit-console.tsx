'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { setMessageAuditVerdict } from '@/lib/admin/audit-actions'

export interface AuditRow {
  channel: 'deal' | 'service_order'
  message_id: string
  status: string
  flagged_reasons: string[]
  auto_flagged: boolean
  note: string | null
  audited_by: string | null
  audited_at: string | null
  created_at: string
  content: string
  sender_type: string
  message_created_at: string | null
}

const REASON_LABELS: Record<string, string> = {
  phone: '전화번호',
  bank_account: '계좌',
  messenger: '외부 메신저',
  email: '이메일',
  direct_deal: '직거래 유도',
}

const STATUS_LABELS: Record<string, string> = {
  unreviewed: '미검토',
  normal: '정상',
  suspicious: '의심',
  violation: '위반',
}

const SENDER_LABELS: Record<string, string> = {
  owner: '기업회원',
  expert: '시니어지식인',
  provider: '전문가회원',
  admin: '매니저',
}

const CHANNEL_LABELS: Record<string, string> = { deal: '매칭 거래', service_order: '서비스 주문' }

const FILTERS = [
  { key: 'unreviewed', label: '미검토' },
  { key: 'suspicious', label: '의심' },
  { key: 'violation', label: '위반' },
  { key: 'normal', label: '정상' },
  { key: 'all', label: '전체' },
] as const

const VERDICTS = [
  { key: 'normal', label: '정상', cls: 'border-success/40 text-success hover:bg-success/5' },
  { key: 'suspicious', label: '의심', cls: 'border-warning/40 text-warning hover:bg-warning/5' },
  { key: 'violation', label: '위반', cls: 'border-error/40 text-error hover:bg-error/5' },
] as const

export function AuditConsole({ rows, activeStatus }: { rows: AuditRow[]; activeStatus: string }) {
  return (
    <div className="flex flex-col gap-4">
      {/* 필터 칩 */}
      <div className="flex gap-1 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={`/message-audit?status=${f.key}`}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              activeStatus === f.key ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-text'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-light bg-card py-10 text-center">
          <p className="text-sm text-text-muted">해당하는 메시지가 없습니다.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map((r) => (
            <AuditRowCard key={`${r.channel}:${r.message_id}`} row={r} />
          ))}
        </div>
      )}
    </div>
  )
}

function AuditRowCard({ row }: { row: AuditRow }) {
  const router = useRouter()
  const [note, setNote] = useState(row.note ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function verdict(v: 'normal' | 'suspicious' | 'violation') {
    setBusy(true)
    setError(null)
    const res = await setMessageAuditVerdict(row.channel, row.message_id, v, note)
    setBusy(false)
    if (res.error) setError(res.error)
    else router.refresh()
  }

  return (
    <div className="rounded-xl border border-border-light bg-card p-4 shadow-xs">
      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded bg-surface px-2 py-0.5 text-text-subtle">{CHANNEL_LABELS[row.channel]}</span>
        <span className="rounded bg-surface px-2 py-0.5 text-text-subtle">{SENDER_LABELS[row.sender_type] ?? row.sender_type}</span>
        {row.flagged_reasons.map((reason) => (
          <span key={reason} className="rounded bg-error/10 px-2 py-0.5 font-medium text-error">
            {REASON_LABELS[reason] ?? reason}
          </span>
        ))}
        <span className="ml-auto rounded bg-surface px-2 py-0.5 text-text-subtle">{STATUS_LABELS[row.status] ?? row.status}</span>
      </div>

      <p className="whitespace-pre-wrap rounded-lg bg-surface-warm p-3 text-sm text-text">{row.content}</p>

      {row.audited_by && (
        <p className="mt-1.5 text-xs text-text-subtle">
          판정: {STATUS_LABELS[row.status]} · {row.audited_by}
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="내부 메모(회원 비노출)"
          rows={2}
          className="focus-ring w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text"
        />
        <div className="flex flex-wrap items-center gap-2">
          {VERDICTS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => verdict(v.key)}
              disabled={busy}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${v.cls}`}
            >
              {v.label}
            </button>
          ))}
          {error && <span className="text-xs text-error">{error}</span>}
        </div>
      </div>
    </div>
  )
}
