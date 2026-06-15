import { cookies } from 'next/headers'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { signInWithGoogle, signInWithKakao, signOut } from '@/lib/auth/actions'
import { GoogleIcon } from '@/components/icons/google'
import { KakaoIcon } from '@/components/icons/kakao'
import { OpenChatButton } from '@/components/open-chat-button'

export default async function Home() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // 로그인 상태: 역할 정보 조회
  let hasClient = false
  let hasPartner = false
  let isAdmin = false
  if (user) {
    const [clientRes, partnerRes] = await Promise.all([
      adminClient.from('client').select('id').eq('auth_user_id', user.id).single(),
      adminClient.from('partner').select('id').eq('auth_user_id', user.id).single(),
    ])
    hasClient = !!clientRes.data
    hasPartner = !!partnerRes.data
    isAdmin = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).includes(user.email || '')
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* 상단 헤더 바 */}
      <header className="sticky top-0 z-40 border-b border-border-light bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary tracking-tight">곁에</Link>
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                href={hasPartner ? '/mypage' : '/request'}
                className="flex items-center gap-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/15 text-xs font-bold text-accent">
                  {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-text">
                  {user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md border border-border-light px-2.5 py-1 text-xs text-text-muted hover:bg-surface hover:text-text transition-colors"
                >
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <form action={signInWithKakao.bind(null, 'client')}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-lg bg-[#FEE500] px-3 py-1.5 text-sm font-medium text-[#191919] shadow-sm hover:bg-[#FDD800] transition-colors btn-press"
              >
                <KakaoIcon className="h-4 w-4" />
                로그인
              </button>
            </form>
          )}
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <main className="flex w-full max-w-md flex-col items-center gap-10 text-center">
          {/* 히어로 */}
          <section className="flex flex-col items-center gap-3 animate-fade-in">
            <h1 className="text-4xl font-bold tracking-tight text-primary">
              곁에
            </h1>
            <p className="text-lg leading-relaxed text-text-muted">
              부울경 시니어·청년의 경험을 검증해
              <br />
              지역 사장님과 직접 연결합니다.
            </p>
          </section>

          {/* 역할 카드 */}
          <section className="flex w-full flex-col gap-4">
            {/* 사장님 카드 */}
            <div className="rounded-2xl bg-white p-6 text-left shadow-sm card-hover animate-fade-in stagger-1">
              <h2 className="text-xl font-bold text-primary">사장님</h2>
              <p className="mt-1 text-sm text-text-muted">
                검증된 파트너에게 일을 맡기세요
              </p>
              {user ? (
                <div className="mt-4 flex gap-2">
                  <Link
                    href="/request"
                    className="flex h-12 flex-1 items-center justify-center rounded-xl bg-primary text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
                  >
                    {hasClient ? '일 맡기기' : '사장님으로 시작하기'}
                  </Link>
                  {hasClient && (
                    <Link
                      href="/status"
                      className="flex h-12 items-center justify-center rounded-xl border border-border-light px-4 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
                    >
                      의뢰 현황
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2">
                  <form action={signInWithKakao.bind(null, 'client')}>
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-base font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
                    >
                      <KakaoIcon />
                      카카오로 시작하기
                    </button>
                  </form>
                  <form action={signInWithGoogle.bind(null, 'client')}>
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-medium text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
                    >
                      <GoogleIcon />
                      Google로 시작하기
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* 파트너 카드 */}
            <div className="rounded-2xl bg-white p-6 text-left shadow-sm card-hover animate-fade-in stagger-2">
              <h2 className="text-xl font-bold text-accent">파트너</h2>
              <p className="mt-1 text-sm text-text-muted">
                경험으로 일하고, 정당한 대가를 받으세요
              </p>
              {user ? (
                <div className="mt-4 flex gap-2">
                  <Link
                    href={hasPartner ? '/matching' : '/register'}
                    className="flex h-12 flex-1 items-center justify-center rounded-xl border-2 border-accent text-base font-semibold text-accent transition-colors hover:bg-accent/5 btn-press"
                  >
                    {hasPartner ? '파트너 영역 가기' : '파트너로 등록하기'}
                  </Link>
                  {hasPartner && (
                    <Link
                      href="/mypage"
                      className="flex h-12 items-center justify-center rounded-xl border border-border-light px-4 text-sm font-medium text-text-muted transition-colors hover:bg-surface hover:text-text"
                    >
                      마이페이지
                    </Link>
                  )}
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-2">
                  <form action={signInWithKakao.bind(null, 'partner')}>
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-base font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
                    >
                      <KakaoIcon />
                      카카오로 시작하기
                    </button>
                  </form>
                  <form action={signInWithGoogle.bind(null, 'partner')}>
                    <button
                      type="submit"
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-medium text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
                    >
                      <GoogleIcon />
                      Google로 시작하기
                    </button>
                  </form>
                </div>
              )}
            </div>
          </section>

          {/* 신뢰 근거 */}
          <section className="w-full rounded-xl border border-border-light bg-surface-warm p-5 text-left animate-fade-in stagger-3">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-text-subtle uppercase">곁에가 약속합니다</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                곁에 3인 검토진이 직접 검증합니다
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                사장님 작업료 0% 수수료 · 에스크로 안전결제
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                파트너 작업료 100% 수령
              </li>
            </ul>
          </section>

          {/* 곁에 매니저 문의 */}
          <OpenChatButton />
        </main>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-border-light bg-surface py-8">
        <div className="mx-auto flex max-w-md flex-col gap-4 px-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-text">곁에 <span className="font-normal text-text-muted">(yourside)</span></p>
              <p className="mt-1 text-xs text-text-subtle">부울경 로컬 인력매칭 플랫폼</p>
            </div>
            <p className="text-xs text-text-subtle">운영: 엔터랩스</p>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
            <span>사업자등록번호: 405-02-46113</span>
            <span>문의: 곁에 매니저 (카카오 채널)</span>
            <span>이메일: iamblackwhite86@gmail.com</span>
          </div>

          <div className="flex gap-3 text-xs">
            <Link href="/privacy" className="text-text-subtle hover:text-text-muted transition-colors">개인정보처리방침</Link>
          </div>

          <hr className="border-border-light" />

          <div className="flex items-center justify-between">
            <p className="text-xs text-text-subtle">&copy; 2025 곁에. All rights reserved.</p>
            {isAdmin ? (
              <Link
                href="/dashboard"
                className="text-xs text-text-subtle hover:text-accent transition-colors"
              >
                관리자 대시보드
              </Link>
            ) : (
              <form action={signInWithGoogle.bind(null, 'client')}>
                <button
                  type="submit"
                  className="text-xs text-text-subtle hover:text-text-muted transition-colors"
                >
                  관리자
                </button>
              </form>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
