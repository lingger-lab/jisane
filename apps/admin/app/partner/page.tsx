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

export const metadata = {
  title: '지사네 파트너공간',
  description: '지사네와 함께 전문서비스를 제공하는 파트너를 위한 공간입니다.',
}

const FEATURES = [
  { title: '파트너 정보 관리', desc: '기관 소개·연락처를 직접 등록하고 관리합니다' },
  { title: '전문서비스 등록', desc: '무료 S/W·P/G부터 유료 서비스까지 직접 올립니다' },
  { title: '신청 내용 확인', desc: '기업·전문가의 서비스 신청을 실시간으로 확인합니다' },
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
        <p className="text-xs font-semibold text-info tracking-wide mb-2">JISANE PARTNERS</p>
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-text leading-snug">
          지사네와 함께
          <br />
          전문서비스를 제공하세요
        </h1>
        <p className="mt-3 text-sm md:text-base text-text-muted">
          파트너는 지사네와 협력해 기업·전문가에게 전문서비스를 제공하는
          특수관계 기관(기업 또는 시니어 전문가)입니다.
        </p>
      </section>

      {/* 기능 3가지 */}
      <section className="grid gap-3 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="rounded-xl border border-border-light border-t-4 border-t-info bg-white p-4 shadow-xs">
            <p className="text-sm font-bold text-text">{f.title}</p>
            <p className="mt-1 text-xs text-text-muted leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* 상태별 CTA */}
      <section className="rounded-2xl bg-info/10 p-6">
        {!user ? (
          <>
            <p className="mb-4 text-center text-sm font-semibold text-text">
              파트너 계정으로 로그인하고 시작하세요
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
            <p className="text-sm font-semibold text-text">아직 파트너 등록 전입니다</p>
            <p className="mt-1 text-xs text-text-muted">등록 신청 후 관리자 승인을 거쳐 활동할 수 있습니다.</p>
            <Link
              href="/partner/apply"
              className="mt-4 inline-block rounded-xl bg-info px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-info/90"
            >
              파트너 등록 신청하기
            </Link>
          </div>
        ) : provider.status === 'active' ? (
          <div className="text-center">
            <p className="text-sm font-semibold text-text">{provider.name} 파트너님, 환영합니다</p>
            <Link
              href="/partner/dashboard"
              className="mt-4 inline-block rounded-xl bg-info px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-info/90"
            >
              파트너 대시보드 열기
            </Link>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-sm font-semibold text-text">
              {provider.status === 'pending'
                ? '등록 신청 심사 중입니다'
                : provider.status === 'rejected'
                ? '등록 신청이 반려되었습니다'
                : '파트너 활동이 중지된 상태입니다'}
            </p>
            <p className="mt-1 text-xs text-text-muted">
              문의: iamblackwhite86@gmail.com
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
