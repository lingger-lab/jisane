'use client'

import { useState } from 'react'
import { submitReview } from '@/lib/admin/actions'

export function ReviewForm({ dealId }: { dealId: string }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (rating === 0) {
      setError('별점을 선택해주세요.')
      return
    }

    setSubmitting(true)
    setError(null)
    const result = await submitReview(dealId, rating, comment, internalNote)
    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      setSubmitted(true)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="font-medium text-green-700">리뷰가 저장되었습니다.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border p-4">
      {error && <p className="mb-3 text-xs text-accent">{error}</p>}

      {/* 별점 */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-text">별점</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl transition-colors ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* 공개 의견 */}
      <div className="mb-4">
        <label htmlFor="comment" className="mb-1 block text-sm font-medium text-text">
          공개 의견
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="기업/시니어에게 공개되는 평가입니다."
          rows={3}
          className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {/* 내부 비고 */}
      <div className="mb-4">
        <label htmlFor="internalNote" className="mb-1 block text-sm font-medium text-text">
          내부 비고 (협조도 등)
        </label>
        <textarea
          id="internalNote"
          value={internalNote}
          onChange={(e) => setInternalNote(e.target.value)}
          placeholder="내부 운영용 메모입니다. 외부에 공개되지 않습니다."
          rows={2}
          className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
      >
        {submitting ? '저장 중...' : '리뷰 저장'}
      </button>
    </div>
  )
}
