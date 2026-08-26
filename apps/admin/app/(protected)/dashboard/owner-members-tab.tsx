'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useConfirmDialog } from '@jisane/ui/confirm-dialog'
import { updateOwnerStatus } from '@/lib/admin/actions'

export interface OwnerMemberItem {
  id: string
  email: string
  company: string | null
  ceo_name: string | null
  region: string | null
  industry: string | null
  status: string
  completed_deals: number
  created_at: string
}

const STATUS: Record<string, { label: string; color: string }> = {
  active: { label: '활성', color: 'bg-primary/10 text-primary' },
  inactive: { label: '비활성', color: 'bg-surface text-text-muted' },
  withdrawn: { label: '탈퇴', color: 'bg-surface text-text-subtle' },
}

function fmtDate(v: string) {
  return new Date(v).toLocaleDateString('ko-KR')
}

export function OwnerMembersTab({ members }: { members: OwnerMemberItem[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ask, confirmDialog] = useConfirmDialog()

  async function handleStatus(m: OwnerMemberItem, status: 'active' | 'inactive') {
    const label = m.company || m.email
    if (
      !(await ask({
        title: status === 'active' ? '회원 활성화' : '회원 비활성화',
        message: `${label} 기업회원을 ${status === 'active' ? '활성화' : '비활성화'}할까요?`,
        danger: status === 'inactive',
      }))
    )
      return
    setBusy(m.id)
    setError(null)
    const result = await updateOwnerStatus(m.id, status)
    if (result.error) setError(result.error)
    setBusy(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-sm font-bold text-text">
        기업회원 <span className="text-text-subtle">({members.length})</span>
        <span className="ml-2 text-xs font-normal text-text-subtle">가입 최신순</span>
      </h3>
      {error && <p className="text-xs text-error">{error}</p>}

      {members.length === 0 ? (
        <p className="rounded-lg border border-border-light p-6 text-center text-sm text-text-muted">
          가입한 기업회원이 없습니다.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map((m) => {
            const badge = STATUS[m.status] || STATUS.inactive
            return (
              <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg border border-border-light p-3">
                <Link href={`/members/owner/${m.id}`} className="-m-1 min-w-0 flex-1 rounded-md p-1 transition-colors hover:bg-surface-warm">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-text">{m.company || '(회사명 미입력)'}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>{badge.label}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-text-subtle">
                    {m.email}
                    {m.ceo_name && ` · ${m.ceo_name}`}
                    {m.region && ` · ${m.region}`}
                    {m.industry && ` · ${m.industry}`}
                  </p>
                  <p className="mt-0.5 text-xs tabular-nums text-text-subtle">
                    가입 {fmtDate(m.created_at)} · 거래 {m.completed_deals}건
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {m.status === 'active' ? (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => handleStatus(m, 'inactive')}
                      className="rounded-lg border border-border-light px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-error/30 hover:text-error disabled:opacity-50"
                    >
                      비활성화
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy === m.id}
                      onClick={() => handleStatus(m, 'active')}
                      className="rounded-lg border border-border-light px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
                    >
                      활성화
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
