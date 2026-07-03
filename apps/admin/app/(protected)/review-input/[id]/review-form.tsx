'use client'

import { useActionState, useState } from 'react'
import { submitReview, generateAiReview } from '@/lib/admin/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

type ReviewState = { error?: string; success?: boolean }

interface AiSuggestion {
  process_rating: number
  result_rating: number
  response_rating: number
  overall_rating: number
  reasoning: string | null
  status: string
}

const AXIS_LABELS = [
  { key: 'process', label: '진행과정', desc: '워크플로우 완료 속도, 일정 준수' },
  { key: 'result', label: '결과물', desc: '검수 통과, 수정 요청 횟수, 만족도' },
  { key: 'response', label: '대응도', desc: '메시지 응답 속도, 커뮤니케이션 빈도' },
] as const

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (v: number) => void
  label: string
}) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star}점`}
          onClick={() => onChange(star)}
          className={`text-2xl transition-colors ${
            star <= value ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function ReviewForm({
  dealId,
  aiSuggestion,
}: {
  dealId: string
  aiSuggestion: AiSuggestion | null
}) {
  const [rating, setRating] = useState(aiSuggestion?.overall_rating || 0)
  const [processRating, setProcessRating] = useState(aiSuggestion?.process_rating || 0)
  const [resultRating, setResultRating] = useState(aiSuggestion?.result_rating || 0)
  const [responseRating, setResponseRating] = useState(aiSuggestion?.response_rating || 0)
  const [generatingAi, setGeneratingAi] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)

  async function action(_prev: ReviewState, formData: FormData): Promise<ReviewState> {
    const r = Number(formData.get('rating'))
    if (r === 0) return { error: '종합 별점을 선택해주세요.' }

    const result = await submitReview(
      dealId,
      r,
      formData.get('comment') as string,
      formData.get('internalNote') as string,
      processRating || undefined,
      resultRating || undefined,
      responseRating || undefined
    )
    if (result.error) return { error: result.error }
    return { success: true }
  }

  const [state, formAction] = useActionState(action, {})

  async function handleGenerateAi() {
    setGeneratingAi(true)
    setAiError(null)
    const result = await generateAiReview(dealId)
    if (result.error) {
      setAiError(result.error)
    }
    setGeneratingAi(false)
    if (!result.error) window.location.reload()
  }

  function handleApplyAi() {
    if (!aiSuggestion) return
    setProcessRating(aiSuggestion.process_rating)
    setResultRating(aiSuggestion.result_rating)
    setResponseRating(aiSuggestion.response_rating)
    setRating(aiSuggestion.overall_rating)
  }

  if (state.success) {
    return (
      <div className="rounded-xl border border-success/20 bg-success-light p-4 text-center">
        <p className="font-medium text-success">리뷰가 저장되었습니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* AI 평가 제안 */}
      {aiSuggestion ? (
        <div className="rounded-xl border border-info/20 bg-info/5 p-4">
          <h3 className="mb-3 text-sm font-bold text-info">AI 평가 제안</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {AXIS_LABELS.map((axis) => {
              const value = axis.key === 'process'
                ? aiSuggestion.process_rating
                : axis.key === 'result'
                  ? aiSuggestion.result_rating
                  : aiSuggestion.response_rating
              return (
                <div key={axis.key}>
                  <p className="text-xs text-text-muted">{axis.label}</p>
                  <p className="text-lg font-bold text-info">
                    {'★'.repeat(value)}{'☆'.repeat(5 - value)}
                  </p>
                  <p className="text-xs text-text-subtle">{value}점</p>
                </div>
              )
            })}
          </div>
          <div className="mt-2 text-center">
            <p className="text-xs text-text-muted">종합</p>
            <p className="text-lg font-bold text-info">
              {'★'.repeat(aiSuggestion.overall_rating)}{'☆'.repeat(5 - aiSuggestion.overall_rating)}
            </p>
          </div>
          {aiSuggestion.reasoning && (
            <p className="mt-2 text-xs text-text-muted">
              <span className="font-medium">근거:</span> {aiSuggestion.reasoning}
            </p>
          )}
          <div className="mt-3">
            <button
              type="button"
              onClick={handleApplyAi}
              className="w-full rounded-lg bg-info px-3 py-2 text-xs font-medium text-white hover:bg-info/90"
            >
              AI 제안 적용
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-info/30 p-4 text-center">
          <p className="text-sm text-text-muted">AI 평가 제안이 없습니다.</p>
          <button
            type="button"
            onClick={handleGenerateAi}
            disabled={generatingAi}
            className="mt-2 rounded-lg bg-info px-4 py-2 text-xs font-medium text-white hover:bg-info/90 disabled:opacity-50"
          >
            {generatingAi ? 'AI 분석 중...' : 'AI 평가 생성'}
          </button>
          {aiError && <p className="mt-2 text-xs text-error">{aiError}</p>}
        </div>
      )}

      {/* 리뷰 입력 폼 */}
      <form action={formAction} className="rounded-xl border border-border p-4">
        {state.error && (
          <p className="mb-3 text-xs text-error" role="alert" aria-live="polite">
            {state.error}
          </p>
        )}

        {/* 다축 평가 */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {AXIS_LABELS.map((axis) => {
            const value = axis.key === 'process'
              ? processRating
              : axis.key === 'result'
                ? resultRating
                : responseRating
            const setter = axis.key === 'process'
              ? setProcessRating
              : axis.key === 'result'
                ? setResultRating
                : setResponseRating
            return (
              <div key={axis.key}>
                <label className="mb-1 block text-sm font-medium text-text">{axis.label}</label>
                <p className="mb-1 text-xs text-text-subtle">{axis.desc}</p>
                <StarRating value={value} onChange={setter} label={axis.label} />
              </div>
            )
          })}
        </div>

        {/* 종합 별점 */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-text" id="rating-label">종합 별점</label>
          <StarRating value={rating} onChange={setRating} label="종합 별점" />
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
    </div>
  )
}
