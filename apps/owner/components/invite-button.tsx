'use client'

import { useActionState } from 'react'
import { createInvitation } from '@/lib/invitation/actions'
import { signInWithKakao, signInWithGoogle } from '@jisane/shared/auth/actions'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { GoogleIcon } from '@jisane/ui/icons/google'

interface InviteButtonProps {
  expertId: string
  isLoggedIn: boolean
  alreadyInvited: boolean
}

export function InviteButton({ expertId, isLoggedIn, alreadyInvited }: InviteButtonProps) {
  const [state, action, isPending] = useActionState(createInvitation, {})

  if (!isLoggedIn) {
    // 앱 표준 로그인 경로(signInWith* 서버액션). 기존 `/api/auth/login`은 owner 앱에
    // 존재하지 않는 라우트라 404였다(감사 docs/10 P1-9, docs/11 P1-11).
    return (
      <div className="flex w-full flex-col gap-2">
        <p className="text-center text-xs text-text-muted">
          로그인하면 이 시니어지식인을 초빙할 수 있어요
        </p>
        <form action={signInWithKakao}>
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-sm font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
          >
            <KakaoIcon className="h-5 w-5 shrink-0" />
            카카오로 로그인
          </button>
        </form>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-sm font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-surface hover:shadow-md btn-press"
          >
            <GoogleIcon className="h-5 w-5 shrink-0" />
            Google로 로그인
          </button>
        </form>
      </div>
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
        {isPending ? '초빙 요청 중...' : '이 시니어지식인 초빙하기'}
      </button>
      {state.error && (
        <p className="mt-2 text-center text-xs text-error">{state.error}</p>
      )}
    </form>
  )
}
