import { LoginDropdown } from './login-dropdown'
import { OwlIcon } from './icons/owl'
import { ThemeToggle } from './theme-toggle'

export function AppHeader({
  appName,
  hubUrl,
  joinUrl,
  userEmail,
  signOutAction,
  signInWithKakao,
  signInWithGoogle,
  showThemeToggle = false,
  children,
}: {
  appName: string
  hubUrl?: string
  joinUrl?: string
  /** 로그인 상태 판별용(표시하지 않음) — 값이 있으면 로그아웃, 없으면 로그인 UI */
  userEmail?: string | null
  signOutAction?: () => Promise<void>
  signInWithKakao?: () => Promise<void>
  signInWithGoogle?: () => Promise<void>
  /** 테마 토글 노출 여부(다크모드 지원 앱만 true). admin은 다크 미지원이라 기본 false */
  showThemeToggle?: boolean
  children?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-light bg-background/80 backdrop-blur-lg">
      <div className="responsive-container flex h-14 items-center justify-between px-4 md:px-6">
        {hubUrl ? (
          <a href={hubUrl} className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity">
            <OwlIcon className="h-7 w-7 shrink-0 text-primary owl-alive" />
            <span className="text-xl md:text-2xl font-bold tracking-tight text-brand-gradient">{appName}</span>
          </a>
        ) : (
          <span className="flex items-baseline gap-1.5">
            <OwlIcon className="h-7 w-7 shrink-0 text-primary owl-alive" />
            <span className="text-xl md:text-2xl font-bold tracking-tight text-brand-gradient">{appName}</span>
          </span>
        )}

        <div className="flex items-center gap-2 md:gap-3">
          {children}

          {showThemeToggle && <ThemeToggle />}

          {userEmail && signOutAction ? (
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-6 items-center text-xs text-text-subtle hover:text-text transition-colors"
              >
                로그아웃
              </button>
            </form>
          ) : signInWithKakao && signInWithGoogle ? (
            <>
              {joinUrl && (
                <a
                  href={joinUrl}
                  className="inline-flex min-h-6 items-center text-xs font-medium text-primary hover:text-primary-light transition-colors"
                >
                  회원가입
                </a>
              )}
              <LoginDropdown
                signInWithKakao={signInWithKakao}
                signInWithGoogle={signInWithGoogle}
              />
            </>
          ) : null}
        </div>
      </div>
    </header>
  )
}
