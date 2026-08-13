'use client'

import { useActionState } from 'react'
import { updateProviderProfile } from '@/lib/partner/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Input } from '@jisane/ui/input'
import { Textarea } from '@jisane/ui/textarea'

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
        <Input id="name" name="name" type="text" required defaultValue={defaults.name} tone="info" />
      </div>

      <div>
        <label htmlFor="contact" className="mb-1 block text-sm font-medium text-text">
          연락처
        </label>
        <Input id="contact" name="contact" type="tel" defaultValue={defaults.contact} placeholder="예: 010-1234-5678" tone="info" />
      </div>

      <div>
        <label htmlFor="website" className="mb-1 block text-sm font-medium text-text">
          웹사이트
        </label>
        <Input id="website" name="website" type="url" defaultValue={defaults.website} placeholder="https://" tone="info" />
      </div>

      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-text">
          소개
        </label>
        <Textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={defaults.description}
          placeholder="기업회원·시니어지식인회원에게 보여줄 소개를 적어주세요."
          tone="info"
        />
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <SubmitButton variant="partner" className="self-start rounded-xl px-6 py-3 font-semibold shadow-sm hover:shadow-md">
        저장하기
      </SubmitButton>
    </form>
  )
}
