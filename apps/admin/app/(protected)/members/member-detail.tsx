'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, X, UserX, RotateCcw } from 'lucide-react'
import { useConfirmDialog } from '@jisane/ui/confirm-dialog'
import { Card } from '@jisane/ui/card'
import { Button } from '@jisane/ui/button'
import { StatusBadge } from '@jisane/ui/status-badge'
import { MEMBER_STATUS_LABELS } from '@jisane/shared/labels'
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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-3 text-sm font-semibold text-text">{children}</h2>
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
        message: `${title} 회원을 '${MEMBER_STATUS_LABELS[next] || next}' 상태로 변경할까요?`,
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
        <ArrowLeft className="h-4 w-4" /> {ROLE_LABEL[role]} 목록
      </Link>

      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-text-subtle">{ROLE_LABEL[role]}</p>
          <h1 className="truncate text-xl font-serif font-bold text-text">{title}</h1>
        </div>
        <StatusBadge kind="member" status={status} />
      </div>

      {error && <p className="mb-4 text-sm text-error" role="alert" aria-live="polite">{error}</p>}

      {/* 프로필 */}
      <Card className="mb-5 p-4">
        <SectionTitle>프로필</SectionTitle>
        <dl className="flex flex-col gap-2 text-sm">
          {profileRows.map((r) => (
            <div key={r.label} className="flex gap-3">
              <dt className="w-24 shrink-0 text-text-subtle">{r.label}</dt>
              <dd className="min-w-0 flex-1 break-words text-text">{r.value || '—'}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {/* 역할 겸유 현황 */}
      <Card className="mb-5 p-4">
        <SectionTitle>이 계정의 역할</SectionTitle>
        <div className="flex flex-col gap-2">
          {holdings.map((h) => (
            <div key={h.role} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm">
                <span className={`inline-flex items-center gap-1.5 ${h.id ? 'text-text' : 'text-text-subtle'}`}>
                  {h.id ? <Check className="h-4 w-4 text-primary" /> : <X className="h-4 w-4 text-text-subtle" />}
                  {ROLE_LABEL[h.role]}
                </span>
                {h.id && h.status && <StatusBadge kind="member" status={h.status} />}
              </div>
              {h.id ? (
                h.role !== role && (
                  <Link
                    href={`/members/${ROLE_ROUTE[h.role]}/${h.id}`}
                    className="inline-flex items-center gap-0.5 text-xs font-medium text-accent hover:text-accent/80 transition-colors"
                  >
                    상세 <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )
              ) : h.role !== 'provider' && authUserId ? (
                <Button variant="outline" size="sm" disabled={busy} onClick={() => grant(h.role as 'owner' | 'expert')}>
                  역할 부여
                </Button>
              ) : (
                h.role === 'provider' && <span className="text-xs text-text-subtle">승인제(본인 신청)</span>
              )}
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-text-subtle">
          잘못된 유형으로 가입한 경우: 올바른 역할을 부여한 뒤 잘못된 역할을 아래에서 탈퇴 처리하세요.
        </p>
      </Card>

      {/* 연관 데이터 */}
      {relatedCounts.length > 0 && (
        <Card className="mb-5 p-4">
          <SectionTitle>연관 데이터</SectionTitle>
          <div className="grid grid-cols-3 gap-3 text-center">
            {relatedCounts.map((c) => (
              <div key={c.label} className="rounded-lg bg-surface p-2">
                <p className="text-lg font-bold tabular-nums text-text">{c.value}</p>
                <p className="text-xs text-text-subtle">{c.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 상태 관리 (중립) */}
      {!withdrawn && (
        <Card className="mb-5 p-4">
          <SectionTitle>상태 관리</SectionTitle>
          <div className="flex flex-wrap gap-2">
            {STATUS_ACTIONS[role]
              .filter((a) => a.value !== status)
              .map((a) => (
                <Button key={a.value} variant="outline" size="sm" disabled={busy} onClick={() => changeStatus(a.value)}>
                  {a.label}
                </Button>
              ))}
          </div>
        </Card>
      )}

      {/* 위험 구역 — 강제 탈퇴 / 재활성만 */}
      <Card className="border-error/25 bg-error/[0.04] p-4">
        <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-error">
          <UserX className="h-4 w-4" /> 위험 구역
        </h2>
        {withdrawn ? (
          <>
            <p className="mb-3 text-xs text-text-muted">탈퇴 처리된 회원입니다. 필요 시 상태만 재활성할 수 있습니다(개인정보 미복원).</p>
            <Button variant="outline" size="sm" disabled={busy} onClick={reactivate}>
              <RotateCcw className="h-3.5 w-3.5" /> 재활성
            </Button>
          </>
        ) : (
          <>
            <p className="mb-3 text-xs text-text-muted">탈퇴 처리 시 개인정보가 즉시 익명화되며 복구할 수 없습니다.</p>
            <Button variant="danger" size="sm" disabled={busy} onClick={withdraw}>
              <UserX className="h-3.5 w-3.5" /> 강제 탈퇴
            </Button>
          </>
        )}
      </Card>

      {confirmDialog}
    </div>
  )
}
