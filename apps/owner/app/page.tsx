import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signInWithGoogle, signInWithKakao, signOut } from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'

export default async function OwnerHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/request')
  }

  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12 animate-slide-up">
      <main className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div>
          <h1 className="text-3xl font-bold text-primary">지사네 기업공간</h1>
          <p className="mt-3 text-base text-text-muted leading-relaxed">
            검증된 시니어 전문가에게
            <br />
            일을 맡기세요
          </p>
        </div>

        <div className="w-full rounded-2xl border border-primary/20 bg-surface-warm p-5 text-left">
          <ul className="flex flex-col gap-2.5 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              시니어 인력 신청 — 필요한 작업을 자유롭게 등록
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              기업 수수료 0% — 매칭비만 별도
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              에스크로 안전결제 — 검수 후 정산
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
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-medium text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
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
