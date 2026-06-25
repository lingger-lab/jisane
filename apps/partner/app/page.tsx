import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signInWithGoogle, signInWithKakao, signOut } from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { PartnerNav } from '@/components/partner-nav'

export default async function PartnerHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: partner } = await adminClient
      .from('partner')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (partner) {
      redirect('/matching')
    }
    redirect('/register')
  }

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 animate-slide-up">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-3xl font-bold text-accent">지사네 시니어공간</h1>
          <p className="mt-3 text-base text-text-muted leading-relaxed">
            경험으로 일하고,
            <br />
            정당한 대가를 받으세요
          </p>
        </div>

        <div className="w-full rounded-2xl border border-accent/20 bg-surface-warm p-5 text-left">
          <ul className="flex flex-col gap-2.5 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              기업 매칭 신청 — 경력과 전문 분야를 등록
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              시니어 수수료 0% — 작업료 전액 지급
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              지사네 에스크로로 안전하게 보관
            </li>
          </ul>
        </div>

        <div className="flex w-full flex-col gap-3">
          <form action={signInWithKakao}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-base font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
            >
              <KakaoIcon />
              카카오로 시작하기
            </button>
          </form>
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-base font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-surface hover:shadow-md btn-press"
            >
              <GoogleIcon />
              Google로 시작하기
            </button>
          </form>
        </div>

        <div className="flex gap-4 text-xs text-text-subtle">
          <a href={`${adminUrl}/service`} className="hover:text-text-muted transition-colors">서비스 안내</a>
          <a href={`${adminUrl}/privacy`} className="hover:text-text-muted transition-colors">개인정보처리방침</a>
        </div>
      </main>
    </div>
  )
}
