'use client'

import { useState } from 'react'
import { useConfirmDialog } from '@jisane/ui/confirm-dialog'
import { updateExpertStatus } from '@/lib/admin/actions'

export interface ExpertMemberItem {
  id: string
  email: string
  real_name: string | null
  name: string | null
  field: string | null
  career_years: number | null
  status: string
  created_at: string
}

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: '활성', color: 'bg-primary/10 text-primary' },
  waiting: { label: '대기', color: 'bg-warning-light text-warning' },
  suspended: { label: '중지', color: 'bg-error-light text-error' },
}

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('ko-KR')
}

export function ExpertMembersTab({ members }: { members: ExpertMemberItem[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ask, confirmDialog] = useConfirmDialog()

  async function handleStatus(m: ExpertMemberItem, status: 'active' | 'suspended') {
    const label = m.real_name || m.name || m.email
    if (
      !(await ask({
        title: status === 'active' ? '회원 활성화' : '회원 중지',
        message: `${label} 시니어지식인 회원을 ${status === 'active' ? '활성화' : '중지'}할까요?`,
        danger: status === 'suspended',
      }))
    )
      return
    setBusy(m.id)
    setError(null)
    const result = await updateExpertStatus(m.id, status)
    if (result.error) setError(result.error)
    setBusy(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-text">
        시니어지식인 회원 <span className="text-text-subtle">({members.length})</span>
        <span className="ml-2 text-xs font-normal text-text-subtle">가입 최신순</span>
      </h3>
      {error && <p className="text-xs text-error">{error}</p>}

      {members.length === 0 ? (
        <p className="rounded-lg border border-border-light p-6 text-center text-sm text-text-muted">
          가입한 시니어지식인 회원이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => {
            const badge = STATUS[m.status] || STATUS.waiting
            return (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border-light p-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-text">{m.real_name || '(실명 미입력)'}</p>
                    {m.name && <span className="shrink-0 text-xs text-text-subtle">활동명 {m.name}</span>}
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-subtle">
                    {m.email}
                    {m.field && ` · ${m.field}`}
                    {m.career_years != null && ` · 경력 ${m.career_years}년`}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-text-subtle">가입 {fmtDate(m.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {m.status === 'suspended' ? (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => handleStatus(m, 'active')}
                      className="rounded-lg border border-border-light px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
                    >
                      활성화
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => handleStatus(m, 'suspended')}
                      className="rounded-lg border border-border-light px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-error/30 hover:text-error disabled:opacity-50"
                    >
                      중지
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      {confirmDialog}
    </div>
  )
}
