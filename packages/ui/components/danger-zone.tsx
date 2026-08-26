'use client'

import { useState, type ReactNode } from 'react'
import { useConfirmDialog } from './confirm-dialog'

/**
 * 위험 액션(회원 탈퇴 등) 공용 섹션 — confirm-dialog(danger) 조합.
 * action은 서버액션. 성공 시 보통 signOut→redirect 하므로 여기로 돌아오지 않는다.
 * 실패({error}) 시에만 에러를 노출한다.
 */
export function DangerZone({
  title = '회원 탈퇴',
  description,
  buttonLabel = '탈퇴하기',
  confirmTitle = '정말 탈퇴하시겠어요?',
  confirmMessage,
  action,
}: {
  title?: string
  description: ReactNode
  buttonLabel?: string
  confirmTitle?: string
  confirmMessage: ReactNode
  action: () => Promise<{ error?: string } | void>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ask, dialog] = useConfirmDialog()

  async function onClick() {
    if (!(await ask({ title: confirmTitle, message: confirmMessage, danger: true, confirmText: buttonLabel }))) return
    setBusy(true)
    setError(null)
    const r = await action()
    if (r && r.error) {
      setError(r.error)
      setBusy(false)
    }
    // 성공 시 action이 signOut→redirect 하므로 이 지점으로 복귀하지 않음.
  }

  return (
    <section className="rounded-xl border border-error/20 bg-error/5 p-4">
      <h2 className="mb-1 text-sm font-semibold text-error">{title}</h2>
      <div className="mb-3 text-xs leading-relaxed text-text-muted">{description}</div>
      {error && (
        <p className="mb-2 text-xs text-error" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={onClick}
        className="rounded-lg bg-error-solid px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-50"
      >
        {busy ? '처리 중…' : buttonLabel}
      </button>
      {dialog}
    </section>
  )
}
