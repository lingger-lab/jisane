import * as React from 'react'
import { GoogleIcon } from './icons/google'
import { KakaoIcon } from './icons/kakao'
import { cn } from '../lib/cn'

type FormAction = React.ComponentProps<'form'>['action']

/** 버튼 크기 프리셋 — 화면 맥락별(랜딩 lg / 카드 md / 그리드 sm) */
const SIZE = {
  sm: { h: 'h-11', text: 'text-sm', icon: 'h-4 w-4' },
  md: { h: 'h-12', text: 'text-sm', icon: 'h-5 w-5' },
  lg: { h: 'h-14', text: 'text-base', icon: 'h-5 w-5' },
} as const

export interface OAuthButtonsProps {
  signInWithKakao: FormAction
  signInWithGoogle: FormAction
  className?: string
  /** 버튼 높이/타이포 프리셋 (기본 lg — 랜딩·로그인 큰 블록) */
  size?: keyof typeof SIZE
  /** "카카오로 __" / "Google로 __" 뒤 문구 (기본 '시작하기') */
  labelSuffix?: string
}

/**
 * 카카오·구글 로그인 버튼 블록 — 앱별 서버 액션을 props로 받는다.
 * 랜딩·로그인·초빙·가입 화면에 손코딩으로 반복되던 인증 블록(hex #FEE500 등)을 단일 소스로 통합.
 * 카카오/구글 브랜드 색은 지정 색상(토큰 아님)이라 그대로 둔다. 서버 안전.
 */
export function OAuthButtons({
  signInWithKakao,
  signInWithGoogle,
  className,
  size = 'lg',
  labelSuffix = '시작하기',
}: OAuthButtonsProps) {
  const s = SIZE[size]
  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <form action={signInWithKakao}>
        <button
          type="submit"
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl overflow-hidden bg-[#FEE500] font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press',
            s.h,
            s.text,
          )}
        >
          <KakaoIcon className={cn('shrink-0', s.icon)} />
          카카오로 {labelSuffix}
        </button>
      </form>
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl overflow-hidden border border-border bg-white font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-surface hover:shadow-md btn-press',
            s.h,
            s.text,
          )}
        >
          <GoogleIcon className={cn('shrink-0', s.icon)} />
          Google로 {labelSuffix}
        </button>
      </form>
    </div>
  )
}
