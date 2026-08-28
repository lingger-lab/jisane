'use client'

import { useActionState } from 'react'
import { createStudioProvider } from '@/lib/studio/actions'
import { SubmitButton } from '@jisane/ui/submit-button'
import { Input } from '@jisane/ui/input'
import { Select } from '@jisane/ui/select'

export function NewProviderForm() {
  const [state, action] = useActionState(createStudioProvider, {})
  return (
    <form action={action} className="flex flex-col gap-2">
      <Input name="name" type="text" required placeholder="제공자명 (기관명 또는 성함)" />
      <Input name="email" type="email" placeholder="이메일 (선택 — 나중에 계정 연결용)" />
      <div className="grid grid-cols-2 gap-2">
        <Select name="kind" required defaultValue="">
          <option value="" disabled>유형</option>
          <option value="company">전문가회원</option>
          <option value="senior">시니어지식인</option>
        </Select>
        <Select name="type" required defaultValue="">
          <option value="" disabled>지원 분야</option>
          <option value="consulting">컨설팅</option>
          <option value="legal">법률</option>
          <option value="tax">세무</option>
          <option value="accounting">회계</option>
          <option value="insurance">보험</option>
        </Select>
      </div>
      {state.error && <p className="text-xs text-error" role="alert">{state.error}</p>}
      <SubmitButton variant="outline" size="sm" className="self-start">제공자 만들기</SubmitButton>
    </form>
  )
}
