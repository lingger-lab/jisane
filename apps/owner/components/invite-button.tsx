'use client'

import { useActionState } from 'react'
import { createInvitation } from '@/lib/invitation/actions'

interface InviteButtonProps {
  expertId: string
  isLoggedIn: boolean
  alreadyInvited: boolean
}

export function InviteButton({ expertId, isLoggedIn, alreadyInvited }: InviteButtonProps) {
  const [state, action, isPending] = useActionState(createInvitation, {})

  if (!isLoggedIn) {
    return (
      <a
        href="/api/auth/login"
        className="flex h-12 w-full items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md btn-press"
      >
        로그인 후 초빙하기
      </a>
    )
  }

  if (alreadyInvited) {
    return (
      <button
        type="button"
        disabled
        className="flex h-12 w-full items-center justify-center rounded-xl bg-surface text-sm font-semibold text-text-muted cursor-not-allowed"
      >
        초빙 완료 (대기 중)
      </button>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="expert_id" value={expertId} />
      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center rounded-xl bg-accent text-sm font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md btn-press disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? '초빙 요청 중...' : '이 전문가 초빙하기'}
      </button>
      {state.error && (
        <p className="mt-2 text-center text-xs text-error">{state.error}</p>
      )}
    </form>
  )
}
