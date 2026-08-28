import { LoginDropdown } from './login-dropdown'
import { OwlIcon } from './icons/owl'
import { ClaudeIcon } from './icons/claude'
import { KakaoIcon } from './icons/kakao'
import { GoogleIcon } from './icons/google'
import { ThemeToggle } from './theme-toggle'
import { NavDrawer } from './nav-drawer'
import { RoleSwitchMenu, type RoleSwitchItem } from './role-switch-menu'

export function AppHeader({
  appName,
  hubUrl,
  joinUrl,
  userEmail,
  signOutAction,
  signInWithKakao,
  signInWithGoogle,
  showThemeToggle = false,
  roleSwitch,
  centerNav,
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
  /** 회원 전환 메뉴 항목(기업↔시니어 등). 비면 미노출 */
  roleSwitch?: RoleSwitchItem[]
  /** 데스크탑 주요 내비(로고 옆). 자체적으로 `hidden md:flex`라 모바일에선 안 보인다(하단탭이 대체). */
  centerNav?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <header className="app-header-scroll sticky top-0 z-40 border-b border-border-light bg-background/80 backdrop-blur-lg">
      <div className="container-app flex h-14 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4 md:gap-6">
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
          {centerNav}
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          {/* 테마 토글을 그룹 맨 앞에 — 디자인 위계상 우선 */}
          {showThemeToggle && <ThemeToggle />}

          {/* Claude 바로가기 — 누구나 쉽게 Claude(claude.ai) 접근 */}
          <a
            href="https://claude.ai"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Claude 열기 (새 탭)"
            title="Claude"
            className="focus-ring inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#d97757] transition-colors hover:bg-surface"
          >
            <ClaudeIcon className="h-5 w-5" />
          </a>

          {children}

          {/* 데스크탑: 회원전환·인증을 인라인으로 (모바일에선 아래 햄버거로 접힘) */}
          <div className="hidden items-center gap-2 md:flex md:gap-3">
            {roleSwitch && roleSwitch.length > 0 && (
              <RoleSwitchMenu items={roleSwitch} loggedIn={!!userEmail} />
            )}

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

          {/* 모바일: 회원전환·인증을 햄버거 드로어로 (혼잡·2줄 넘침 방지) */}
          {((roleSwitch && roleSwitch.length > 0) ||
            (userEmail && signOutAction) ||
            (signInWithKakao && signInWithGoogle)) && (
            <NavDrawer label="메뉴">
              {roleSwitch && roleSwitch.length > 0 && (
                <nav className="flex flex-col gap-1">
                  <p className="px-1 pb-1 text-xs font-medium text-text-subtle">회원 전환</p>
                  {roleSwitch.map((it) => (
                    <a
                      key={it.url}
                      href={it.url}
                      className="rounded-lg px-3 py-2.5 text-sm text-text-muted transition-colors hover:bg-surface hover:text-text"
                    >
                      {it.label}
                    </a>
                  ))}
                </nav>
              )}
              <div className="mt-4 border-t border-border-light pt-4">
                {userEmail && signOutAction ? (
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="focus-ring w-full rounded-lg px-3 py-2.5 text-left text-sm text-text-muted transition-colors hover:bg-surface hover:text-text"
                    >
                      로그아웃
                    </button>
                  </form>
                ) : signInWithKakao && signInWithGoogle ? (
                  <div className="flex flex-col gap-1">
                    {joinUrl && (
                      <a
                        href={joinUrl}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-surface"
                      >
                        회원가입
                      </a>
                    )}
                    <form action={signInWithKakao}>
                      <button
                        type="submit"
                        className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text transition-colors hover:bg-[#FEE500]/20"
                      >
                        <KakaoIcon className="h-4 w-4" />
                        카카오로 로그인
                      </button>
                    </form>
                    <form action={signInWithGoogle}>
                      <button
                        type="submit"
                        className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-text transition-colors hover:bg-surface"
                      >
                        <GoogleIcon className="h-4 w-4" />
                        Google로 로그인
                      </button>
                    </form>
                  </div>
                ) : null}
              </div>
            </NavDrawer>
          )}
        </div>
      </div>
    </header>
  )
}
