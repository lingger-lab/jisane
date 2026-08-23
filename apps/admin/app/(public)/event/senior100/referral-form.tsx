'use client'

import { useActionState } from 'react'
import { submitEventReferral } from '@/lib/event/actions'
import { Input } from '@jisane/ui/input'
import { Textarea } from '@jisane/ui/textarea'
import { SubmitButton } from '@jisane/ui/submit-button'

export function ReferralForm() {
  const [state, formAction] = useActionState(submitEventReferral, {})

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="rounded-xl border border-border-light bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-text">① 리워드 받으실 분 (추천인)</p>
        <div className="flex flex-col gap-3">
          <div>
            <label htmlFor="referrer_name" className="mb-1 block text-sm font-medium text-text">
              성함 <span className="text-error">*</span>
            </label>
            <Input id="referrer_name" name="referrer_name" type="text" required tone="accent" placeholder="본인 성함" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="referrer_contact" className="mb-1 block text-sm font-medium text-text">
                연락처 <span className="text-error">*</span>
              </label>
              <Input id="referrer_contact" name="referrer_contact" type="tel" required tone="accent" placeholder="010-0000-0000" />
            </div>
            <div>
              <label htmlFor="referrer_email" className="mb-1 block text-sm font-medium text-text">
                이메일 <span className="text-xs text-text-subtle">(선택)</span>
              </label>
              <Input id="referrer_email" name="referrer_email" type="email" tone="accent" placeholder="선택 입력" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border-light bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-text">② 초빙된 시니어 (추천대상)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="referee_name" className="mb-1 block text-sm font-medium text-text">
              성함 <span className="text-error">*</span>
            </label>
            <Input id="referee_name" name="referee_name" type="text" required tone="accent" placeholder="초빙된 시니어 성함" />
          </div>
          <div>
            <label htmlFor="referee_contact" className="mb-1 block text-sm font-medium text-text">
              연락처 <span className="text-error">*</span>
            </label>
            <Input id="referee_contact" name="referee_contact" type="tel" required tone="accent" placeholder="010-0000-0000" />
          </div>
        </div>
        <p className="mt-2 text-xs text-text-subtle">여러 분을 추천하셨다면 한 분씩 각각 접수해주세요.</p>
      </div>

      <div>
        <label htmlFor="note" className="mb-1 block text-sm font-medium text-text">
          메모 <span className="text-xs text-text-subtle">(선택)</span>
        </label>
        <Textarea id="note" name="note" rows={2} tone="accent" placeholder="전달할 내용이 있으면 적어주세요" />
      </div>

      {state.error && (
        <p className="text-sm text-error" role="alert" aria-live="polite">{state.error}</p>
      )}

      <SubmitButton variant="accent" className="self-start rounded-xl px-6 py-3 font-semibold shadow-sm hover:shadow-md">
        초빙 접수하기
      </SubmitButton>
    </form>
  )
}
