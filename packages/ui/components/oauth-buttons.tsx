import * as React from 'react'
import { GoogleIcon } from './icons/google'
import { KakaoIcon } from './icons/kakao'
import { cn } from '../lib/cn'

type FormAction = React.ComponentProps<'form'>['action']

export interface OAuthButtonsProps {
  signInWithKakao: FormAction
  signInWithGoogle: FormAction
  className?: string
}

/**
 * 카카오·구글 로그인 버튼 블록 — 앱별 서버 액션을 props로 받는다.
 * 랜딩·로그인 화면에 손코딩으로 반복되던 인증 블록을 단일 소스로 통합.
 * 카카오/구글 브랜드 색은 지정 색상(토큰 아님)이라 그대로 둔다. 서버 안전.
 */
export function OAuthButtons({ signInWithKakao, signInWithGoogle, className }: OAuthButtonsProps) {
  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <form action={signInWithKakao}>
        <button
          type="submit"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl overflow-hidden bg-[#FEE500] text-base font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
        >
          <KakaoIcon className="h-5 w-5 shrink-0" />
          카카오로 시작하기
        </button>
      </form>
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="flex h-14 w-full items-center justify-center gap-2 rounded-xl overflow-hidden border border-border bg-white text-base font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-surface hover:shadow-md btn-press"
        >
          <GoogleIcon className="h-5 w-5 shrink-0" />
          Google로 시작하기
        </button>
      </form>
    </div>
  )
}
