import { LoginDropdown } from './login-dropdown'

export function AppHeader({
  appName,
  userEmail,
  signOutAction,
  signInWithKakao,
  signInWithGoogle,
  children,
}: {
  appName: string
  userEmail?: string | null
  signOutAction?: () => Promise<void>
  signInWithKakao?: () => Promise<void>
  signInWithGoogle?: () => Promise<void>
  children?: React.ReactNode
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border-light bg-background/80 backdrop-blur-lg">
      <div className="responsive-container flex h-14 items-center justify-between px-4 md:px-6">
        <span className="text-xl md:text-2xl font-bold tracking-tight text-brand-gradient">
          {appName}
        </span>

        <div className="flex items-center gap-3">
          {children}

          {userEmail && signOutAction ? (
            <>
              <span className="text-xs text-text-muted truncate max-w-[140px]">
                {userEmail}
              </span>
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-xs text-text-subtle hover:text-text transition-colors"
                >
                  로그아웃
                </button>
              </form>
            </>
          ) : signInWithKakao && signInWithGoogle ? (
            <LoginDropdown
              signInWithKakao={signInWithKakao}
              signInWithGoogle={signInWithGoogle}
            />
          ) : null}
        </div>
      </div>
    </header>
  )
}
