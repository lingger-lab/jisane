'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { syncEnterlabsSkills } from '@/lib/enterprise/actions'

/**
 * AX대시보드(자산허브 앱스킬) → 지식서비스 동기화 버튼. 멱등 — 여러 번 눌러도 안전.
 * 관리자 노출설정(visible)·5대지원 매칭(pillar)은 동기화가 보존한다.
 */
export function SyncSkillsButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [isError, setIsError] = useState(false)

  async function handleSync() {
    setBusy(true)
    setMsg(null)
    setIsError(false)
    const r = await syncEnterlabsSkills()
    setBusy(false)
    if (!r.ok) {
      setIsError(true)
      setMsg(r.error)
      return
    }
    const parts = [`반영 ${r.upserted}건`]
    if (r.archived > 0) parts.push(`보관 ${r.archived}건`)
    if (r.skipped.length > 0) parts.push(`건너뜀 ${r.skipped.length}건(회원/기존 slug 충돌)`)
    setMsg(parts.join(' · '))
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleSync}
        disabled={busy}
        className="rounded-xl border border-border-light px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
      >
        {busy ? '동기화 중…' : 'AX대시보드 동기화'}
      </button>
      {msg && (
        <span className={`text-xs ${isError ? 'text-error' : 'text-text-subtle'}`} role="status" aria-live="polite">
          {msg}
        </span>
      )}
    </div>
  )
}
