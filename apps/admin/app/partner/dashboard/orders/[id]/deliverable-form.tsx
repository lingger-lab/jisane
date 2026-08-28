'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitDeliverable } from '@/lib/partner/actions'

/**
 * 산출물 전달 폼 — processing 단계에서 공급자가 링크+메모로 전달(완료 처리의 선행조건).
 * 이미 전달했으면 현재 산출물을 보여주고 갱신할 수 있게 한다.
 */
export function DeliverableForm({
  orderId,
  deliverableUrl,
  deliverableNote,
  deliveredAt,
}: {
  orderId: string
  deliverableUrl: string | null
  deliverableNote: string | null
  deliveredAt: string | null
}) {
  const router = useRouter()
  const [url, setUrl] = useState(deliverableUrl ?? '')
  const [note, setNote] = useState(deliverableNote ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setBusy(true)
    setError(null)
    const r = await submitDeliverable(orderId, url, note)
    setBusy(false)
    if (r.error) setError(r.error)
    else router.refresh()
  }

  return (
    <div className="mt-4 rounded-lg border border-border-light bg-surface-warm p-3">
      <p className="mb-2 text-xs font-medium text-text">
        산출물 전달 {deliveredAt && <span className="text-success">· 전달 완료</span>}
      </p>
      <div className="flex flex-col gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="산출물 링크 (https://…)"
          className="focus-ring rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="전달 메모(선택)"
          rows={2}
          className="focus-ring rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text"
        />
        <div className="flex items-center justify-between gap-2">
          {error ? (
            <span className="text-xs text-error">{error}</span>
          ) : (
            <span className="text-xs text-text-subtle">전달 후 완료 처리를 할 수 있습니다.</span>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={busy}
            className="shrink-0 rounded-lg bg-partner px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:brightness-95 disabled:opacity-50"
          >
            {busy ? '전달 중…' : deliveredAt ? '산출물 갱신' : '산출물 전달'}
          </button>
        </div>
      </div>
    </div>
  )
}
