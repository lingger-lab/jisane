'use client'

import { useState } from 'react'
import { submitReview } from '@/lib/deal/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { FilterRadioGroup } from '@jisane/ui/filter-radio-group'
import { StarRating } from '@jisane/ui/star-rating'
import { Star } from 'lucide-react'

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
        <StarRating value={displayRating || 0} />
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
      <p className="mb-3 text-xs text-text-muted">시니어지식인의 작업에 대해 평가해주세요.</p>

      {/* 별점 — APG radio 패턴(화살표 이동·선택)은 FilterRadioGroup이 담당 (감사 docs/10 P3-67) */}
      <div className="mb-3 flex items-center gap-1">
        <FilterRadioGroup
          options={['1', '2', '3', '4', '5'].map((star) => ({
            value: star,
            label: <Star className="h-6 w-6" fill="currentColor" strokeWidth={0} aria-hidden="true" />,
            ariaLabel: `${star}점`,
          }))}
          value={rating > 0 ? String(rating) : null}
          onChange={(v) => setRating(Number(v))}
          label="작업 평점"
          selectOnArrow
          className="flex items-center gap-1"
          optionClassName={(_selected, star) =>
            `transition-colors ${
              Number(star) <= rating ? 'text-accent' : 'text-border-light hover:text-accent/40'
            }`
          }
        />
        {rating > 0 && (
          <span className="ml-2 text-sm text-text-muted">{rating}점</span>
        )}
      </div>

      {/* 코멘트 */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={2}
        aria-label="작업 소감"
        placeholder="작업에 대한 소감을 남겨주세요 (선택)"
        className="mb-3 w-full resize-none rounded-xl border border-border-light bg-background px-3 py-2 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
      />

      {error && <p className="mb-2 text-xs text-error" role="alert" aria-live="polite">{error}</p>}

      <form action={handleSubmit}>
        <SubmitButton variant="accent" className="w-full">
          리뷰 제출
        </SubmitButton>
      </form>
    </div>
  )
}
