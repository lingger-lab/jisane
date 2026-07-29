'use client'

import { useState } from 'react'
import { archiveServicePackage } from '@/lib/partner/actions'

export function ArchiveButton({ packageId }: { packageId: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleArchive() {
    if (!confirm('이 서비스를 보관 처리할까요? 목록에서 더 이상 노출되지 않습니다.')) return
    setBusy(true)
    setError(null)
    const result = await archiveServicePackage(packageId)
    if (result.error) setError(result.error)
    setBusy(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleArchive}
        disabled={busy}
        className="rounded-lg border border-border-light px-3 py-1.5 text-xs font-medium text-text-subtle transition-colors hover:border-error/30 hover:text-error disabled:opacity-50"
      >
        {busy ? '처리 중…' : '보관'}
      </button>
      {error && <span className="text-xs text-error">{error}</span>}
    </>
  )
}
