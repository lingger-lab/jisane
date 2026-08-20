'use client'

import { useActionState } from 'react'
import { upsertEventNotice } from '@/lib/event/actions'
import { Textarea } from '@jisane/ui/textarea'
import { SubmitButton } from '@jisane/ui/submit-button'

/** 발표 공지 편집 — 게시 시 이벤트 페이지(/event/senior100) 배너에 노출 */
export function NoticeEditor({
  defaultBody,
  defaultPublished,
}: {
  defaultBody: string
  defaultPublished: boolean
}) {
  const [state, formAction] = useActionState(upsertEventNotice, {})

  return (
    <form action={formAction} className="rounded-xl border border-border-light bg-card p-4">
      <p className="mb-2 text-sm font-bold text-text">발표 공지 (이벤트 페이지 배너)</p>
      <Textarea
        name="body"
        rows={3}
        defaultValue={defaultBody}
        placeholder="예: 현재 62명 초빙이 진행 중입니다. 종료 후 지급 대상께 개별 연락드립니다."
      />
      <label className="mt-3 flex items-center gap-2 text-sm text-text">
        <input
          type="checkbox"
          name="published"
          defaultChecked={defaultPublished}
          className="h-4 w-4 rounded border-border accent-accent"
        />
        게시(이벤트 페이지에 노출)
      </label>
      {state.error && <p className="mt-2 text-sm text-error" role="alert" aria-live="polite">{state.error}</p>}
      <div className="mt-3">
        <SubmitButton variant="accent" className="rounded-lg px-4 py-2 text-sm font-semibold">
          공지 저장
        </SubmitButton>
      </div>
    </form>
  )
}
