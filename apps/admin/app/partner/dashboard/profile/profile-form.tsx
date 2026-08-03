'use client'

import { useActionState } from 'react'
import { updateProviderProfile } from '@/lib/partner/actions'
import { SubmitButton } from '@jisane/ui/submit-button'

const INPUT_CLASS =
  'w-full rounded-xl border border-border-light bg-background px-4 py-3 text-sm text-text placeholder:text-text-subtle focus:border-info focus:ring-1 focus:ring-info/20 focus:outline-none transition-colors'

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; contact: string; website: string; description: string }
}) {
  const [state, formAction] = useActionState(updateProviderProfile, {})

  return (
    <form action={formAction} className="flex max-w-xl flex-col gap-5">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm font-medium text-text">
          기관명 또는 성함 <span className="text-error">*</span>
        </label>
        <input id="name" name="name" type="text" required defaultValue={defaults.name} className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="contact" className="mb-1 block text-sm font-medium text-text">
          연락처
        </label>
        <input id="contact" name="contact" type="tel" defaultValue={defaults.contact} placeholder="예: 010-1234-5678" className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="website" className="mb-1 block text-sm font-medium text-text">
          웹사이트
        </label>
        <input id="website" name="website" type="url" defaultValue={defaults.website} placeholder="https://" className={INPUT_CLASS} />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-text">
          소개
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={defaults.description}
          placeholder="기업회원·시니어지식인회원에게 보여줄 소개를 적어주세요."
          className={`${INPUT_CLASS} resize-none`}
        />
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <SubmitButton className="self-start rounded-xl bg-info px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-info/90 hover:shadow-md disabled:opacity-50">
        저장하기
      </SubmitButton>
    </form>
  )
}
