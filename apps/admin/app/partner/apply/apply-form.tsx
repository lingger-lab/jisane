'use client'

import { useActionState } from 'react'
import { applyAsPartner } from '@/lib/partner/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

const INPUT_CLASS =
  'w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-info focus:ring-1 focus:ring-info/20 focus:outline-none transition-colors'

export function ApplyForm() {
  const [state, formAction] = useActionState(applyAsPartner, {})

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
          기관명 또는 성함 <span className="text-error">*</span>
        </label>
        <input id="name" name="name" type="text" required placeholder="예: 엔터랩스" className={INPUT_CLASS} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="kind" className="mb-1 block text-sm font-medium text-text">
            파트너 유형 <span className="text-error">*</span>
          </label>
          <select id="kind" name="kind" required defaultValue="" className={INPUT_CLASS}>
            <option value="" disabled>선택</option>
            <option value="company">기업</option>
            <option value="senior">시니어 전문가</option>
          </select>
        </div>
        <div>
          <label htmlFor="type" className="mb-1 block text-sm font-medium text-text">
            전문 분야 <span className="text-error">*</span>
          </label>
          <select id="type" name="type" required defaultValue="" className={INPUT_CLASS}>
            <option value="" disabled>선택</option>
            <option value="consulting">컨설팅</option>
            <option value="legal">법무</option>
            <option value="tax">세무</option>
            <option value="accounting">회계</option>
            <option value="insurance">보험</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="contact" className="mb-1 block text-sm font-medium text-text">
          연락처 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <input id="contact" name="contact" type="tel" placeholder="예: 010-1234-5678" className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="website" className="mb-1 block text-sm font-medium text-text">
          웹사이트 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <input id="website" name="website" type="url" placeholder="https://" className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-text">
          소개 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          placeholder="제공하려는 서비스와 경력을 간단히 소개해주세요."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <SubmitButton className="rounded-xl bg-info px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-info/90 hover:shadow-md disabled:opacity-50">
        등록 신청하기
      </SubmitButton>
    </form>
  )
}
