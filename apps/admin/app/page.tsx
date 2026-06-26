import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'

export default async function AdminHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user && (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).includes(user.email || '')

  const partnerUrl = process.env.NEXT_PUBLIC_PARTNER_URL || 'https://partner.jisane.cloud'
  const ownerUrl = process.env.NEXT_PUBLIC_OWNER_URL || 'https://owner.jisane.cloud'

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border-light bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold text-primary tracking-tight">지사네</Link>
          <div className="flex items-center gap-3">
            <Link href="/ax" className="text-xs text-text-muted hover:text-text transition-colors">AX 전환</Link>
            <Link href="/service" className="text-xs text-text-muted hover:text-text transition-colors">서비스 안내</Link>
            {isAdmin && (
              <Link href="/dashboard" className="text-xs text-accent font-medium hover:text-accent/80 transition-colors">관리자</Link>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10">
        <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
          <section className="flex flex-col items-center gap-3 animate-fade-in">
            <Image
              src="/jisaneadmin-hero-image.png"
              alt="지사네"
              width={280}
              height={100}
              priority
              className="h-auto w-[280px]"
            />
            <h1 className="sr-only">지사네</h1>
            <p className="text-base text-text-muted leading-relaxed">
              부울경 검증된 시니어 전문가를
              <br />
              지역 기업과 직접 연결합니다.
            </p>
          </section>

          <section className="flex w-full flex-col gap-4 animate-fade-in stagger-1">
            <a
              href={partnerUrl}
              className="rounded-2xl border-2 border-accent bg-white p-5 text-left shadow-sm card-hover"
            >
              <h2 className="text-xl font-bold text-accent">시니어공간</h2>
              <p className="mt-1 text-sm text-text-muted">경험으로 일하고, 정당한 대가를 받으세요</p>
              <div className="mt-3 text-sm font-semibold text-accent">바로가기 &rarr;</div>
            </a>

            <a
              href={ownerUrl}
              className="rounded-2xl border-2 border-primary bg-white p-5 text-left shadow-sm card-hover"
            >
              <h2 className="text-xl font-bold text-primary">기업공간</h2>
              <p className="mt-1 text-sm text-text-muted">검증된 시니어 전문가에게 일을 맡기세요</p>
              <div className="mt-3 text-sm font-semibold text-primary">바로가기 &rarr;</div>
            </a>
          </section>

          <section className="w-full rounded-xl border border-border-light bg-surface-warm p-5 text-left animate-fade-in stagger-2">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-text-subtle uppercase">지사네가 약속합니다</h3>
            <ul className="flex flex-col gap-2 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                지사네 전문가 네트워크가 직접 검증합니다
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                에스크로 안전결제 · 검수 후 정산
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                시니어 수수료 0% — 작업료 전액 지급
              </li>
            </ul>
          </section>

          {!user && (
            <div className="flex w-full flex-col gap-2 animate-fade-in stagger-3">
              <p className="text-xs text-text-subtle mb-1">관리자 로그인</p>
              <form action={signInWithKakao}>
                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-sm font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
                >
                  <KakaoIcon className="h-4 w-4" />
                  카카오로 로그인
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      <footer className="border-t border-border-light bg-surface py-6">
        <div className="mx-auto flex max-w-md flex-col gap-4 px-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-text">지사네 <span className="font-normal text-text-muted">(jisane)</span></p>
              <p className="mt-1 text-xs text-text-subtle">부울경 로컬 인력매칭 플랫폼</p>
            </div>
            <p className="text-xs text-text-subtle">운영: (주)지사네</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
            <span>사업자등록번호: 405-02-46113</span>
            <span>이메일: iamblackwhite86@gmail.com</span>
          </div>
          <div className="flex gap-3 text-xs">
            <Link href="/privacy" className="text-text-subtle hover:text-text-muted transition-colors">개인정보처리방침</Link>
            <Link href="/service" className="text-text-subtle hover:text-text-muted transition-colors">서비스 안내</Link>
            <Link href="/ax" className="text-text-subtle hover:text-text-muted transition-colors">AX 전환</Link>
          </div>
          <hr className="border-border-light" />
          <p className="text-xs text-text-subtle">&copy; 2025 (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
