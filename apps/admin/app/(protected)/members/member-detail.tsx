'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useConfirmDialog } from '@jisane/ui/confirm-dialog'
import {
  updateOwnerStatus,
  updateExpertStatus,
  updateProviderStatus,
  withdrawMemberByAdmin,
  grantRoleByAdmin,
  reactivateMemberByAdmin,
} from '@/lib/admin/actions'

export type MemberRole = 'owner' | 'expert' | 'provider'

const ROLE_LABEL: Record<MemberRole, string> = { owner: '기업회원', expert: '시니어지식인', provider: '전문가회원' }
const ROLE_ROUTE: Record<MemberRole, string> = { owner: 'owner', expert: 'expert', provider: 'partner' }

const STATUS_LABEL: Record<string, string> = {
  active: '활성',
  inactive: '비활성',
  waiting: '대기',
  suspended: '중지',
  pending: '승인대기',
  rejected: '반려',
  withdrawn: '탈퇴',
}
const STATUS_COLOR: Record<string, string> = {
  active: 'bg-primary/10 text-primary',
  inactive: 'bg-surface text-text-muted',
  waiting: 'bg-warning-light text-warning',
  suspended: 'bg-error-light text-error',
  pending: 'bg-warning-light text-warning',
  rejected: 'bg-error-light text-error',
  withdrawn: 'bg-surface text-text-subtle',
}

// 역할별 관리자가 설정 가능한 상태 전이(탈퇴/승인대기 제외 — 탈퇴는 강제탈퇴 액션으로).
const STATUS_ACTIONS: Record<MemberRole, { value: string; label: string; danger?: boolean }[]> = {
  owner: [
    { value: 'active', label: '활성화' },
    { value: 'inactive', label: '비활성화', danger: true },
  ],
  expert: [
    { value: 'active', label: '활성화' },
    { value: 'suspended', label: '중지', danger: true },
  ],
  provider: [
    { value: 'active', label: '승인/활성화' },
    { value: 'rejected', label: '반려', danger: true },
    { value: 'suspended', label: '중지', danger: true },
  ],
}

export interface RoleHolding {
  role: MemberRole
  id: string | null
  status: string | null
}

export interface MemberDetailProps {
  role: MemberRole
  id: string
  authUserId: string | null
  title: string
  status: string
  profileRows: { label: string; value: string }[]
  relatedCounts: { label: string; value: number }[]
  /** 같은 auth 계정의 세 역할 보유 현황 */
  holdings: RoleHolding[]
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLOR[status] || STATUS_COLOR.inactive}`}>
      {STATUS_LABEL[status] || status}
    </span>
  )
}

export function MemberDetail({ role, id, authUserId, title, status, profileRows, relatedCounts, holdings }: MemberDetailProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ask, confirmDialog] = useConfirmDialog()

  async function run(fn: () => Promise<{ error?: string }>) {
    setBusy(true)
    setError(null)
    const r = await fn()
    if (r.error) setError(r.error)
    else router.refresh()
    setBusy(false)
  }

  async function changeStatus(next: string) {
    if (
      !(await ask({
        title: '상태 변경',
        message: `${title} 회원을 '${STATUS_LABEL[next] || next}' 상태로 변경할까요?`,
        danger: next === 'inactive' || next === 'suspended' || next === 'rejected',
      }))
    )
      return
    await run(() =>
      role === 'owner'
        ? updateOwnerStatus(id, next as 'active' | 'inactive')
        : role === 'expert'
          ? updateExpertStatus(id, next as 'active' | 'waiting' | 'suspended')
          : updateProviderStatus(id, next as 'active' | 'rejected' | 'suspended'),
    )
  }

  async function withdraw() {
    if (
      !(await ask({
        title: '강제 탈퇴',
        message:
          '이 회원 역할을 탈퇴 처리합니다. 개인정보가 즉시 익명화되어 복구할 수 없습니다(거래·정산 기록은 법령에 따라 보존). 계속할까요?',
        danger: true,
        confirmText: '탈퇴 처리',
      }))
    )
      return
    await run(() => withdrawMemberByAdmin(role, id))
  }

  async function reactivate() {
    if (
      !(await ask({
        title: '재활성',
        message: '상태를 활성으로 되돌립니다. 익명화된 개인정보는 복원되지 않으며 회원이 다시 입력해야 합니다.',
      }))
    )
      return
    await run(() => reactivateMemberByAdmin(role, id))
  }

  async function grant(target: 'owner' | 'expert') {
    if (!authUserId) return
    if (
      !(await ask({
        title: '역할 부여',
        message: `이 계정에 '${ROLE_LABEL[target]}' 역할을 부여합니다. 회원이 해당 앱에서 부족한 정보를 입력하면 이용할 수 있습니다.`,
      }))
    )
      return
    await run(() => grantRoleByAdmin(authUserId, target))
  }

  const withdrawn = status === 'withdrawn'

  return (
    <div className="mx-auto max-w-2xl px-4 md:px-6 py-6 animate-fade-in">
      <Link
        href={`/members/${ROLE_ROUTE[role]}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text transition-colors"
      >
        &larr; {ROLE_LABEL[role]} 목록
      </Link>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-text-subtle">{ROLE_LABEL[role]}</p>
          <h1 className="truncate text-xl font-serif font-bold text-text">{title}</h1>
        </div>
        <StatusBadge status={status} />
      </div>

      {error && <p className="mb-4 text-sm text-error" role="alert" aria-live="polite">{error}</p>}

      {/* 프로필 */}
      <section className="mb-5 rounded-xl border border-border-light bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-text">프로필</h2>
        <dl className="flex flex-col gap-2 text-sm">
          {profileRows.map((r) => (
            <div key={r.label} className="flex gap-3">
              <dt className="w-24 shrink-0 text-text-subtle">{r.label}</dt>
              <dd className="min-w-0 flex-1 break-words text-text">{r.value || '—'}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* 역할 겸유 현황 */}
      <section className="mb-5 rounded-xl border border-border-light bg-card p-4">
        <h2 className="mb-3 text-sm font-semibold text-text">이 계정의 역할</h2>
        <div className="flex flex-col gap-2">
          {holdings.map((h) => (
            <div key={h.role} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className={h.id ? 'text-text' : 'text-text-subtle'}>
                  {h.id ? '✓' : '✗'} {ROLE_LABEL[h.role]}
                </span>
                {h.id && h.status && <StatusBadge status={h.status} />}
              </div>
              {h.id ? (
                h.role !== role && (
                  <Link
                    href={`/members/${ROLE_ROUTE[h.role]}/${h.id}`}
                    className="text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    상세 →
                  </Link>
                )
              ) : h.role !== 'provider' && authUserId ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => grant(h.role as 'owner' | 'expert')}
                  className="rounded-lg border border-border-light px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
                >
                  역할 부여
                </button>
              ) : (
                h.role === 'provider' && <span className="text-xs text-text-subtle">승인제(본인 신청)</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-subtle">
          잘못된 유형으로 가입한 경우: 올바른 역할을 부여한 뒤 잘못된 역할을 아래에서 탈퇴 처리하세요.
        </p>
      </section>

      {/* 연관 데이터 */}
      {relatedCounts.length > 0 && (
        <section className="mb-5 rounded-xl border border-border-light bg-card p-4">
          <h2 className="mb-3 text-sm font-semibold text-text">연관 데이터</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            {relatedCounts.map((c) => (
              <div key={c.label} className="rounded-lg bg-surface-warm p-2">
                <p className="text-lg font-bold text-text tabular-nums">{c.value}</p>
                <p className="text-xs text-text-subtle">{c.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 위험 액션 */}
      <section className="rounded-xl border border-error/20 bg-error/5 p-4">
        <h2 className="mb-1 text-sm font-semibold text-error">관리 액션</h2>
        {withdrawn ? (
          <>
            <p className="mb-3 text-xs text-text-muted">탈퇴 처리된 회원입니다. 필요 시 상태만 재활성할 수 있습니다(개인정보 미복원).</p>
            <button
              type="button"
              disabled={busy}
              onClick={reactivate}
              className="rounded-lg border border-border-light bg-card px-3 py-1.5 text-xs font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
            >
              재활성
            </button>
          </>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap gap-2">
              {STATUS_ACTIONS[role]
                .filter((a) => a.value !== status)
                .map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    disabled={busy}
                    onClick={() => changeStatus(a.value)}
                    className={`rounded-lg border border-border-light bg-card px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${
                      a.danger ? 'text-text-muted hover:border-error/30 hover:text-error' : 'text-text-muted hover:border-primary/30 hover:text-primary'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={withdraw}
              className="rounded-lg bg-error-solid px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-50"
            >
              강제 탈퇴
            </button>
          </>
        )}
      </section>

      {confirmDialog}
    </div>
  )
}
