'use client'

import { useActionState } from 'react'
import { updateOwnerProfile } from '@/lib/profile/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Input } from '@jisane/ui/input'

export function OwnerProfileForm({
  defaults,
}: {
  defaults: {
    company: string
    ceo_name: string
    contact: string
    region: string
    industry: string
  }
}) {
  const [state, formAction] = useActionState(updateOwnerProfile, {})

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div>
        <label htmlFor="company" className="mb-1 block text-sm font-medium text-text">
          회사명 또는 상호 <span className="text-error">*</span>
        </label>
        <Input id="company" name="company" type="text" required defaultValue={defaults.company} placeholder="예: ㈜지사네" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ceo_name" className="mb-1 block text-sm font-medium text-text">
            대표자명
          </label>
          <Input id="ceo_name" name="ceo_name" type="text" defaultValue={defaults.ceo_name} placeholder="예: 홍길동" />
        </div>
        <div>
          <label htmlFor="contact" className="mb-1 block text-sm font-medium text-text">
            연락처
          </label>
          <Input id="contact" name="contact" type="tel" defaultValue={defaults.contact} placeholder="예: 010-1234-5678" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="region" className="mb-1 block text-sm font-medium text-text">
            지역
          </label>
          <Input id="region" name="region" type="text" defaultValue={defaults.region} placeholder="예: 부산 해운대" />
        </div>
        <div>
          <label htmlFor="industry" className="mb-1 block text-sm font-medium text-text">
            업종
          </label>
          <Input id="industry" name="industry" type="text" defaultValue={defaults.industry} placeholder="예: 외식업" />
        </div>
      </div>

      {state.error && <p className="text-sm text-error">{state.error}</p>}

      <SubmitButton className="self-start rounded-xl bg-primary px-6 py-3 font-semibold text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md disabled:opacity-50">
        저장하기
      </SubmitButton>
    </form>
  )
}
