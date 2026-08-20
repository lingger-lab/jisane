import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import {
  joinAsOwnerKakao,
  joinAsOwnerGoogle,
  joinAsExpertKakao,
  joinAsExpertGoogle,
  signInWithKakaoPartner,
  signInWithGooglePartner,
} from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'

export const metadata = {
  title: '회원가입 | 지사네',
  description: '어떤 회원으로 지사네와 함께하시나요? — 기업회원 · 시니어지식인회원 · 전문가회원',
}

const ROLES = [
  {
    key: 'owner',
    accent: 'primary',
    name: '기업회원',
    tagline: 'S/W·P/G를 쓰고, 시니어지식인에게 일을 맡깁니다',
    price: '가입 무료 · 선택 구독 월 18,000원',
    benefits: [
      'S/W·P/G 사용',
      '시니어지식인 정보 열람 · 직접 연락',
      '에스크로 안전 직거래',
    ],
    kakao: joinAsOwnerKakao,
    google: joinAsOwnerGoogle,
  },
  {
    key: 'expert',
    accent: 'accent',
    name: '시니어지식인회원',
    tagline: '경험의 값어치를 온전히 — 작업료 전액 수령',
    price: '가입 무료 · 선택 구독 월 9,000원',
    benefits: [
      '의뢰 수임 · 수수료 0%',
      '구독 시 S/W·P/G 사용',
      '역량 강화 교육 프로그램',
    ],
    kakao: joinAsExpertKakao,
    google: joinAsExpertGoogle,
  },
  {
    key: 'partner',
    accent: 'info',
    name: '전문가회원',
    tagline: '전문서비스를 제공하는 특수관계 회원',
    price: '협약 · 관리자 승인제',
    benefits: [
      '전문서비스 직접 등록 · 관리',
      '플랫폼 수익의 20% 수수료 납부',
      '플랫폼 월 수익의 1% 성장 공유',
    ],
    kakao: signInWithKakaoPartner,
    google: signInWithGooglePartner,
  },
] as const

const ACCENT: Record<string, { text: string; chip: string }> = {
  primary: { text: 'text-primary', chip: 'bg-primary/10 text-primary' },
  accent: { text: 'text-accent', chip: 'bg-accent/10 text-accent' },
  info: { text: 'text-partner', chip: 'bg-partner/10 text-partner' },
}

export default async function JoinPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 md:px-6 py-12 animate-fade-in">
      {/* 헤더 */}
      <section className="text-center">
        <p className="text-xs font-semibold text-primary tracking-wide mb-2">지사네 회원가입</p>
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-text leading-snug">
          어떤 회원으로 함께하시나요?
        </h1>
        <p className="mt-3 text-sm md:text-base text-text-muted">
          역할을 선택하면 카카오·구글 계정으로 바로 시작할 수 있습니다.
        </p>
        {user && (
          <p className="mt-2 text-xs text-text-subtle">
            이미 로그인되어 있습니다 — 아래에서 시작할 역할을 선택하면 해당 공간으로 이동합니다.
          </p>
        )}
      </section>

      {/* 역할 3택 */}
      <section className="grid gap-4 md:grid-cols-3">
        {ROLES.map((role) => {
          const c = ACCENT[role.accent]
          return (
            <div
              key={role.key}
              className="flex flex-col rounded-2xl border border-border-light bg-card p-5 shadow-sm"
            >
              <h2 className={`text-lg font-bold ${c.text}`}>{role.name}</h2>
              <p className="mt-1 text-xs text-text-muted leading-relaxed">{role.tagline}</p>
              <span className={`mt-3 inline-block self-start rounded-full px-3 py-1 text-xs font-semibold ${c.chip}`}>
                {role.price}
              </span>

              <ul className="mt-4 flex flex-1 flex-col gap-1.5">
                {role.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-1.5 text-xs text-text-muted">
                    <span className={`mt-1 h-1 w-1 shrink-0 rounded-full ${c.text.replace('text-', 'bg-')}`} />
                    {b}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-col gap-2">
                <form action={role.kakao}>
                  <button
                    type="submit"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-sm font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
                  >
                    <KakaoIcon className="h-4 w-4 shrink-0" />
                    카카오로 시작
                  </button>
                </form>
                <form action={role.google}>
                  <button
                    type="submit"
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-sm font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-surface hover:shadow-md btn-press"
                  >
                    <GoogleIcon className="h-4 w-4 shrink-0" />
                    Google로 시작
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </section>

      {/* 안내 */}
      <section className="rounded-xl bg-surface-warm p-4 text-center">
        <p className="text-xs text-text-muted leading-relaxed">
          이미 계정이 있어도 같은 버튼으로 로그인됩니다 — 지사네는 카카오·구글 간편 로그인으로
          가입과 로그인이 하나로 이어집니다.
          <br />
          한 계정으로 여러 역할을 함께 이용할 수 있습니다.
        </p>
        <Link href="/" className="mt-3 inline-block text-xs font-medium text-primary hover:underline">
          지사네 홈으로 &rarr;
        </Link>
      </section>
    </div>
  )
}
