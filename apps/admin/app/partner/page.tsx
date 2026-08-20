import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import {
  signInWithGooglePartner,
  signInWithKakaoPartner,
} from '@jisane/shared/auth/actions'
import { getProviderByAuthUser } from '@jisane/shared/provider/auth'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { EXPERT_URL } from '@/lib/urls'

export const metadata = {
  title: '지사네 전문가회원',
  description: '지사네와 함께 전문서비스를 제공하는 전문가회원을 위한 공간입니다.',
}

const FEATURES = [
  { title: '전문가회원 정보 관리', desc: '기관 소개·연락처를 직접 등록하고 관리합니다' },
  { title: '전문서비스 등록', desc: '무료 S/W·P/G부터 유료 서비스까지 직접 올립니다' },
  { title: '신청 내용 확인', desc: '기업회원·시니어지식인회원의 서비스 신청을 실시간으로 확인합니다' },
]

export default async function PartnerHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const provider = user ? await getProviderByAuthUser(user.id) : null

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 px-6 py-12 animate-fade-in">
      {/* 히어로 */}
      <section className="text-center">
        <p className="text-xs font-semibold text-partner tracking-wide mb-2">JISANE PARTNERS</p>
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-text leading-snug">
          지사네와 함께
          <br />
          전문서비스를 제공하세요
        </h1>
        <p className="mt-3 text-sm md:text-base text-text-muted">
          전문가회원은 지사네와 협력해 기업회원·시니어지식인회원에게 전문서비스를 제공하는
          특수관계 회원(기업 또는 시니어지식인)입니다.
        </p>
        <p className="mt-2 text-xs text-text-subtle">
          플랫폼 이용 수익의 20%를 수수료로 납부하고, 플랫폼 월 수익의 1%를 성장 공유로 돌려받습니다.
        </p>
      </section>

      {/* 기능 3가지 */}
      <section className="grid gap-3 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-border-light bg-card p-4 shadow-xs">
            <p className="text-sm font-bold text-text">{f.title}</p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* 상태별 CTA */}
      <section className="rounded-2xl bg-partner/10 p-6">
        {!user ? (
          <>
            <p className="mb-4 text-center text-sm font-semibold text-text">
              전문가회원 계정으로 로그인하고 시작하세요
            </p>
            <div className="flex flex-col gap-3">
              <form action={signInWithKakaoPartner}>
                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-sm font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
                >
                  <KakaoIcon className="h-5 w-5 shrink-0" />
                  카카오로 시작하기
                </button>
              </form>
              <form action={signInWithGooglePartner}>
                <button
                  type="submit"
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-sm font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-surface hover:shadow-md btn-press"
                >
                  <GoogleIcon className="h-5 w-5 shrink-0" />
                  Google로 시작하기
                </button>
              </form>
            </div>
          </>
        ) : !provider ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-text">아직 전문가회원 등록 전입니다</p>
            <p className="mt-1 text-xs text-text-muted">등록 신청 후 관리자 승인을 거쳐 활동할 수 있습니다.</p>
            <Link
              href="/partner/apply"
              className="mt-4 inline-block rounded-xl bg-partner-solid px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-partner-solid/90"
            >
              전문가회원 등록 신청하기
            </Link>
          </div>
        ) : provider.status === 'active' ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-text">{provider.name} 전문가회원님, 환영합니다</p>
            <Link
              href="/partner/dashboard"
              className="mt-4 inline-block rounded-xl bg-partner-solid px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-partner-solid/90"
            >
              전문가회원 대시보드 열기
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold text-text">
              {provider.status === 'pending'
                ? '등록 신청 심사 중입니다'
                : provider.status === 'rejected'
                ? '등록 신청이 반려되었습니다'
                : '전문가회원 활동이 중지된 상태입니다'}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              문의: iamblackwhite86@gmail.com
            </p>
            {/* dual-role 허용 — 반려/중지여도 시니어지식인(전문가)으로는 활동 가능 */}
            <a
              href={EXPERT_URL}
              className="mt-4 inline-block rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent/90"
            >
              시니어지식인으로 가입하기 &rarr;
            </a>
          </div>
        )}
      </section>
    </div>
  )
}
