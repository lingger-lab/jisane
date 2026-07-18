'use client'

import { useState } from 'react'

interface ReviewDisputeButtonProps {
  reviewId: string
  hasOpenDispute: boolean
}

export function ReviewDisputeButton({ reviewId, hasOpenDispute }: ReviewDisputeButtonProps) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ ok?: boolean; error?: string } | null>(null)

  if (hasOpenDispute) {
    return (
      <div className="rounded-xl border border-warning/20 bg-warning-light p-4">
        <p className="text-sm font-medium text-warning">리뷰 이의제기가 접수되어 처리 중입니다.</p>
      </div>
    )
  }

  if (result?.ok) {
    return (
      <div className="rounded-xl border border-info/20 bg-info-light p-4">
        <p className="text-sm font-medium text-info">이의제기가 접수되었습니다. 관리자가 확인 후 연락드리겠습니다.</p>
      </div>
    )
  }

  async function handleSubmit() {
    if (!reason.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, reason: reason.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResult({ error: data.error || '오류가 발생했습니다.' })
      } else {
        setResult({ ok: true })
      }
    } catch {
      setResult({ error: '네트워크 오류가 발생했습니다.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border-light p-4 shadow-xs">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm font-medium text-error hover:underline"
        >
          리뷰 이의 제기
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-text">리뷰 이의 제기</h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="이의제기 사유를 입력해주세요"
            rows={3}
            className="w-full rounded-lg border border-border p-2.5 text-sm focus:border-accent focus:outline-none"
          />
          {result?.error && (
            <p className="text-xs text-error">{result.error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !reason.trim()}
              className="rounded-lg bg-error px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? '접수 중...' : '이의제기 접수'}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setReason(''); setResult(null) }}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
