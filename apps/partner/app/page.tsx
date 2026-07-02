import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { fetchPartnerLandingStats } from '@jisane/shared/landing-stats'
import { getPackagesByAudience } from '@jisane/shared/service-catalog'
import { CategoryBrowse } from '@/components/category-browse'

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

  const stats = await fetchPartnerLandingStats()
  const education = getPackagesByAudience('partner')
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'

  // 핵심 수치 (완료거래 0이면 3칸)
  const metrics: { value: string | number; label: string }[] = [
    { value: `${stats.totalClients}+`, label: '참여 기업' },
    { value: `${stats.totalOpenRequests}건`, label: '열린 의뢰' },
    { value: '0%', label: '수수료' },
  ]
  if (stats.totalCompletedDeals > 0) {
    metrics.push({ value: `${stats.totalCompletedDeals}건`, label: '완료 거래' })
  }

  return (
    <div className="flex flex-1 flex-col items-center animate-slide-up">
      {/* [1] Hero */}
      <section className="flex w-full max-w-md flex-col items-center gap-4 px-4 pt-10 pb-6 text-center">
        <Image
          src="/jisanepartner-hero-image.png"
          alt="지사네 시니어공간"
          width={280}
          height={100}
          priority
          className="h-auto w-[280px]"
        />
        <h1 className="sr-only">지사네 시니어공간</h1>
        <p className="text-base font-medium text-text leading-relaxed">
          경험으로 일하고,
          <br />
          정당한 대가를 받으세요
        </p>
        <p className="text-sm text-text-muted">부울경 시니어 전문가 네트워크</p>

        <div className="flex w-full flex-col gap-3">
          <form action={signInWithKakao}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl overflow-hidden bg-[#FEE500] text-base font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
            >
              <KakaoIcon className="h-5 w-5 shrink-0" />
              카카오로 시작하기
            </button>
          </form>
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl overflow-hidden border border-border bg-white text-base font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-surface hover:shadow-md btn-press"
            >
              <GoogleIcon className="h-5 w-5 shrink-0" />
              Google로 시작하기
            </button>
          </form>
        </div>
      </section>

      {/* [2] 핵심 수치 */}
      <section className="w-full max-w-md px-4 py-6">
        <div className={`grid gap-3 ${metrics.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center rounded-xl bg-surface-warm p-3">
              <span className="text-2xl font-bold text-accent">{m.value}</span>
              <span className="mt-0.5 text-xs text-text-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* [3] 카테고리별 의뢰 현황 */}
      <section className="w-full max-w-md px-4 py-6">
        <CategoryBrowse
          categoryCounts={stats.categoryCounts}
          newRequestsThisMonth={stats.newRequestsThisMonth}
        />
      </section>

      {/* [4] 전문가 역량 강화 프로그램 */}
      <section className="w-full max-w-md px-4 py-6">
        <h2 className="text-lg font-bold text-text">경험에 AI를 더합니다</h2>
        <p className="mt-1 text-sm text-text-muted">전문가 역량 강화 프로그램</p>
        <div className="mt-3 flex flex-col gap-3">
          {education.map((pkg) => (
            <div
              key={pkg.slug}
              className="rounded-xl border border-border-light p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-text">{pkg.name}</h3>
                  <p className="mt-1 text-xs text-text-muted leading-relaxed">
                    {pkg.valueDesc}
                  </p>
                </div>
                {pkg.duration && (
                  <span className="shrink-0 text-xs text-text-subtle">{pkg.duration}</span>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                <Link
                  href={`/education/${pkg.slug}`}
                  className="rounded-lg border border-border-light px-4 py-2 text-xs font-medium text-text-muted transition-colors hover:border-accent/30 hover:text-accent"
                >
                  자세히 보기
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* [5] 신뢰 배지 */}
      <section className="w-full max-w-md px-4 py-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { title: '수수료 0%', desc: '작업료 전액 지급' },
            { title: '에스크로', desc: '보장결제' },
            { title: '전문가 직접', desc: '매칭' },
          ].map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-center rounded-xl border border-border-light bg-white p-3 text-center shadow-xs"
            >
              <span className="text-sm font-bold text-accent">{badge.title}</span>
              <span className="mt-0.5 text-[10px] text-text-muted">{badge.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* [6] CTA 반복 */}
      <section className="w-full max-w-md px-4 py-6">
        <p className="mb-4 text-center text-base font-semibold text-text">
          지금 전문가로 등록하세요
        </p>
        <div className="flex w-full flex-col gap-3">
          <form action={signInWithKakao}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl overflow-hidden bg-[#FEE500] text-base font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
            >
              <KakaoIcon className="h-5 w-5 shrink-0" />
              카카오로 시작하기
            </button>
          </form>
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl overflow-hidden border border-border bg-white text-base font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-surface hover:shadow-md btn-press"
            >
              <GoogleIcon className="h-5 w-5 shrink-0" />
              Google로 시작하기
            </button>
          </form>
        </div>
      </section>

      {/* [7] 푸터 */}
      <footer className="w-full max-w-md px-4 py-6">
        <div className="flex justify-center gap-4 text-xs text-text-subtle">
          <a href={`${adminUrl}/service`} className="hover:text-text-muted transition-colors">서비스 안내</a>
          <a href={`${adminUrl}/privacy`} className="hover:text-text-muted transition-colors">개인정보처리방침</a>
        </div>
      </footer>
    </div>
  )
}
