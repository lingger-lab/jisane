'use client'

import { useState } from 'react'
import { completeOrder } from '@/lib/partner/actions'

export function CompleteOrderButton({ orderId }: { orderId: string }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleComplete() {
    if (!confirm('이 신청을 완료 처리할까요? 서비스 제공이 끝났을 때만 완료해주세요.')) return
    setBusy(true)
    setError(null)
    const result = await completeOrder(orderId)
    if (result.error) setError(result.error)
    setBusy(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={handleComplete}
        disabled={busy}
        className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-50"
      >
        {busy ? '처리 중…' : '완료 처리'}
      </button>
      {error && <span className="max-w-[140px] text-right text-xs text-error">{error}</span>}
    </>
  )
}
