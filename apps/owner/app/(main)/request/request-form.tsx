'use client'

import { useActionState, useState } from 'react'
import { createRequest } from '@/lib/request/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { MoneyInput } from '@jisane/ui/money-input'
import { Input } from '@jisane/ui/input'
import { Textarea } from '@jisane/ui/textarea'
import { useUnsavedGuard } from '@jisane/ui/use-unsaved-guard'
import { CATEGORY_LABELS } from '@jisane/shared/categories'

export function RequestForm() {
  const [state, formAction] = useActionState(createRequest, {})
  const [selectedChip, setSelectedChip] = useState<string | null>(null)
  const guard = useUnsavedGuard()

  return (
    <form action={formAction} onChange={guard.markDirty} onSubmit={guard.reset} className="flex flex-col gap-5">
      {/* 분야 선택 (평면 12) */}
      <div>
        <label className="mb-2 block text-sm font-medium text-text">
          어떤 분야의 일을 맡기시나요?
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {CATEGORY_LABELS.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setSelectedChip(selectedChip === chip ? null : chip)}
              aria-pressed={selectedChip === chip}
              className={`rounded-lg border px-2 py-2 text-xs text-center leading-tight break-keep transition-colors ${
                selectedChip === chip
                  ? 'border-accent bg-accent/10 font-medium text-accent'
                  : 'border-border-light text-text-muted hover:border-accent/30'
              }`}
            >
              {chip}
            </button>
          ))}
        </div>
        <input type="hidden" name="req_type" value={selectedChip || ''} />
      </div>

      {/* 제목 */}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-text">
          의뢰 제목 <span className="text-error">*</span>
        </label>
        <Input
          id="title"
          name="title"
          type="text"
          required
          placeholder="예: 카페 로고 디자인 의뢰"
        />
      </div>

      {/* 상세 내용 */}
      <div>
        <label htmlFor="detail" className="mb-1 block text-sm font-medium text-text">
          상세 내용 <span className="text-error">*</span>
        </label>
        <Textarea
          id="detail"
          name="detail"
          required
          rows={6}
          placeholder="원하시는 작업 내용을 자유롭게 적어주세요. 지사네 매니저가 확인 후 적합한 시니어지식인을 연결해드립니다."
        />
      </div>

      {/* 희망 예산 (선택) */}
      <div>
        <label htmlFor="budget_hope" className="mb-1 block text-sm font-medium text-text">
          희망 예산 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <div className="relative">
          <MoneyInput
            id="budget_hope"
            name="budget_hope"
            placeholder="예: 500,000"
            className="w-full rounded-xl border border-border-light bg-background px-4 py-3 pr-10 text-sm text-text placeholder:text-text-subtle focus:border-primary focus:ring-1 focus:ring-primary/20 focus:outline-none transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-text-muted">원</span>
        </div>
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <SubmitButton variant="primary" className="rounded-xl px-6 py-3 font-semibold shadow-sm hover:shadow-md">
        의뢰 등록하기
      </SubmitButton>
    </form>
  )
}
