'use client'

import { useState } from 'react'
import { submitReview } from '@/lib/deal/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

interface ReviewSectionProps {
  dealId: string
  existingReview: { id: string; rating: number | null; comment: string | null } | null
}

export function ReviewSection({ dealId, existingReview }: ReviewSectionProps) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(!!existingReview)

  if (submitted || existingReview) {
    const displayRating = existingReview?.rating || rating
    const displayComment = existingReview?.comment || comment

    return (
      <div className="rounded-xl border border-border-light p-4 shadow-xs">
        <h3 className="mb-2 text-sm font-semibold text-text">리뷰 완료</h3>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`text-lg ${star <= (displayRating || 0) ? 'text-warning' : 'text-border'}`}
            >
              ★
            </span>
          ))}
        </div>
        {displayComment && (
          <p className="mt-2 text-sm text-text-muted">{displayComment}</p>
        )}
        <p className="mt-2 text-xs text-text-subtle">소중한 리뷰 감사합니다.</p>
      </div>
    )
  }

  async function handleSubmit() {
    if (rating === 0) {
      setError('별점을 선택해주세요.')
      return
    }
    setError(null)
    const result = await submitReview(dealId, rating, comment)
    if (result.error) {
      setError(result.error)
    } else {
      setSubmitted(true)
    }
  }

  return (
    <div className="rounded-xl border border-accent/20 bg-surface-warm p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-text">작업은 어떠셨나요?</h3>
      <p className="mb-3 text-xs text-text-muted">시니어 전문가의 작업에 대해 평가해주세요.</p>

      {/* 별점 */}
      <div className="mb-3 flex items-center gap-1" role="radiogroup" aria-label="작업 평점">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star}점`}
            onClick={() => setRating(star)}
            className={`text-2xl transition-colors ${
              star <= rating ? 'text-warning' : 'text-border hover:text-warning/50'
            }`}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span className="ml-2 text-sm text-text-muted">{rating}점</span>
        )}
      </div>

      {/* 코멘트 */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        placeholder="작업에 대한 소감을 남겨주세요 (선택)"
        className="mb-3 w-full resize-none rounded-xl border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
      />

      {error && <p className="mb-2 text-xs text-error" role="alert" aria-live="polite">{error}</p>}

      <form action={handleSubmit}>
        <SubmitButton className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90 disabled:opacity-50">
          리뷰 제출
        </SubmitButton>
      </form>
    </div>
  )
}
