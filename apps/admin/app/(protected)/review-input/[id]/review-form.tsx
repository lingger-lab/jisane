'use client'

import { useActionState, useState } from 'react'
import { submitReview } from '@/lib/admin/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

type ReviewState = { error?: string; success?: boolean }

export function ReviewForm({ dealId }: { dealId: string }) {
  const [rating, setRating] = useState(0)

  async function action(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
    const r = Number(formData.get('rating'))
    if (r === 0) return { error: '별점을 선택해주세요.' }

    const result = await submitReview(
      dealId,
      r,
      formData.get('comment') as string,
      formData.get('internalNote') as string
    )
    if (result.error) return { error: result.error }
    return { success: true }
  }

  const [state, formAction] = useActionState(action, {})

  if (state.success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
        <p className="font-medium text-green-700">리뷰가 저장되었습니다.</p>
      </div>
    )
  }

  return (
    <form action={formAction} className="rounded-lg border border-border p-4">
      {state.error && (
        <p className="mb-3 text-xs text-error" role="alert" aria-live="polite">
          {state.error}
        </p>
      )}

      {/* 별점 */}
      <div className="mb-4">
        <label className="mb-2 block text-sm font-medium text-text" id="rating-label">별점</label>
        <div className="flex gap-1" role="radiogroup" aria-labelledby="rating-label">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star}점`}
              onClick={() => setRating(star)}
              className={`text-3xl transition-colors ${
                star <= rating ? 'text-yellow-400' : 'text-gray-300'
              } hover:text-yellow-400`}
            >
              ★
            </button>
          ))}
        </div>
        <input type="hidden" name="rating" value={rating} />
      </div>

      {/* 공개 의견 */}
      <div className="mb-4">
        <label htmlFor="comment" className="mb-1 block text-sm font-medium text-text">
          공개 의견
        </label>
        <textarea
          id="comment"
          name="comment"
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
          name="internalNote"
          placeholder="내부 운영용 메모입니다. 외부에 공개되지 않습니다."
          rows={2}
          className="w-full rounded-lg border border-border bg-surface p-3 text-sm text-text placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <SubmitButton className="w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50">
        리뷰 저장
      </SubmitButton>
    </form>
  )
}
