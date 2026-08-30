'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  CONSULTATION_STATUSES,
  CONSULTATION_STATUS_LABELS,
  CONSULTATION_ASSIGNEES,
  setConsultationStatus,
  setConsultationAssignee,
  setConsultationNote,
  type ConsultationStatus,
} from '@/lib/consultation/actions'

export interface ConsultationRow {
  id: string
  name: string
  phone: string
  detail: string | null
  package_name: string | null
  status: ConsultationStatus
  assigned_admin: string | null
  admin_note: string | null
  marketing_consent_at: string | null
  created_at: string
}

const STATUS_BADGE: Record<ConsultationStatus, string> = {
  received: 'bg-accent/10 text-accent',
  assigned: 'bg-primary/10 text-primary',
  in_progress: 'bg-primary/10 text-primary',
  done: 'bg-surface text-text-subtle',
  on_hold: 'bg-warning/10 text-warning',
  spam: 'bg-surface text-text-subtle',
}

/** 접수 후 경과시간 뱃지 — 미처리(received)가 24h/72h 넘으면 경고. 렌더 시 계산(크론 불요). */
function ElapsedBadge({ createdAt, status }: { createdAt: string; status: ConsultationStatus }) {
  if (status !== 'received') return null
  const hours = (Date.now() - new Date(createdAt).getTime()) / 3_600_000
  if (hours < 24) return null
  const days = Math.floor(hours / 24)
  const strong = hours >= 72
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
        strong ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
      }`}
    >
      {days}일 경과 · 미처리
    </span>
  )
}

export function ConsultationTab({ inquiries }: { inquiries: ConsultationRow[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function run(fn: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const r = await fn()
      if (r?.error) alert(r.error)
      else router.refresh()
    })
  }

  if (inquiries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border-light py-12 text-center">
        <p className="text-sm text-text-muted">접수된 상담 문의가 없습니다.</p>
      </div>
    )
  }

  return (
    <ul className="flex flex-col gap-3">
      {inquiries.map((q) => (
        <li key={q.id} className="rounded-xl border border-border-light bg-card p-4 shadow-xs">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-text">{q.name}</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[q.status]}`}
                >
                  {CONSULTATION_STATUS_LABELS[q.status]}
                </span>
                <ElapsedBadge createdAt={q.created_at} status={q.status} />
                {q.marketing_consent_at && (
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    마케팅 수신동의
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-text-muted tabular-nums">
                {q.package_name ? `${q.package_name} · ` : ''}
                {new Date(q.created_at).toLocaleString('ko-KR')}
              </p>
              {q.detail && <p className="mt-2 text-sm text-text-muted whitespace-pre-wrap">{q.detail}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <a
                href={`tel:${q.phone}`}
                className="focus-ring inline-flex items-center rounded-lg border border-border-light px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-surface"
              >
                {q.phone}
              </a>
              <select
                aria-label="담당자"
                defaultValue={q.assigned_admin ?? ''}
                disabled={pending}
                onChange={(e) => run(() => setConsultationAssignee(q.id, e.target.value))}
                className="rounded-lg border border-border-light bg-background px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none"
              >
                <option value="">담당 미지정</option>
                {CONSULTATION_ASSIGNEES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
              <select
                aria-label="상태"
                value={q.status}
                disabled={pending}
                onChange={(e) => run(() => setConsultationStatus(q.id, e.target.value))}
                className="rounded-lg border border-border-light bg-background px-2 py-1.5 text-sm text-text focus:border-primary focus:outline-none"
              >
                {CONSULTATION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {CONSULTATION_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 대응 메모 — 민감정보 기재 금지, 통화 요지만 */}
          <form
            action={(fd) => run(() => setConsultationNote(q.id, (fd.get('note') as string) ?? ''))}
            className="mt-3 flex items-start gap-2"
          >
            <textarea
              name="note"
              rows={1}
              defaultValue={q.admin_note ?? ''}
              placeholder="대응 메모(통화 요지 — 민감정보 기재 금지)"
              className="flex-1 resize-y rounded-lg border border-border-light bg-background px-3 py-1.5 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="focus-ring shrink-0 rounded-lg border border-border-light px-3 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-50"
            >
              저장
            </button>
          </form>
        </li>
      ))}
    </ul>
  )
}
