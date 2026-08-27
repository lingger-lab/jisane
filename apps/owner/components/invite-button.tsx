'use client'

import { useActionState } from 'react'
import { createInvitation } from '@/lib/invitation/actions'
// 초대 수락은 명시적 기업회원 가입 의사 — join=1 콜백으로 owner 행을 생성(/join 튕김 방지).
import { joinAsOwnerKakao, joinAsOwnerGoogle } from '@jisane/shared/auth/actions'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { Button } from '@jisane/ui/button'

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
        <form action={joinAsOwnerKakao}>
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-sm font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
          >
            <KakaoIcon className="h-5 w-5 shrink-0" />
            카카오로 로그인
          </button>
        </form>
        <form action={joinAsOwnerGoogle}>
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
      <Button type="button" variant="outline" disabled className="h-12 w-full">
        초빙 완료 (대기 중)
      </Button>
    )
  }

  return (
    <form action={action}>
      <input type="hidden" name="expert_id" value={expertId} />
      <Button type="submit" variant="accent" disabled={isPending} className="h-12 w-full shadow-sm hover:shadow-md">
        {isPending ? '초빙 요청 중...' : '이 시니어지식인 초빙하기'}
      </Button>
      {state.error && (
        <p className="mt-2 text-center text-xs text-error">{state.error}</p>
      )}
    </form>
  )
}
