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
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { TextRotator } from '@jisane/ui/text-rotator'
import { AnimatedCounter } from '@jisane/ui/animated-counter'

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
  const ownerUrl = process.env.NEXT_PUBLIC_OWNER_URL || 'https://owner.jisane.cloud'

  // 핵심 수치 (완료거래 0이면 3칸)
  const metrics: { end: number; suffix: string; label: string }[] = [
    { end: stats.totalClients, suffix: '+', label: '참여 기업' },
    { end: stats.totalOpenRequests, suffix: '건', label: '열린 의뢰' },
    { end: 0, suffix: '%', label: '수수료' },
  ]
  if (stats.totalCompletedDeals > 0) {
    metrics.push({ end: stats.totalCompletedDeals, suffix: '건', label: '완료 거래' })
  }

  return (
    <div className="flex flex-1 flex-col items-center animate-slide-up">
      {/* [1] Hero */}
      <section className="responsive-container flex flex-col items-center gap-4 px-4 md:px-6 pt-10 pb-6 text-center">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-text leading-relaxed">
          <TextRotator
            words={['경영컨설팅', '사업계획서', 'AI 전환', '품질관리', '데이터분석']}
            className="text-brand-gradient"
          />
          {' '}경험으로
          <br />
          정당한 대가를 받으세요
        </h1>
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
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <div className={`grid gap-3 md:gap-4 ${metrics.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center rounded-xl bg-surface-warm p-4 md:p-5">
              <AnimatedCounter end={m.end} suffix={m.suffix} className="text-2xl font-bold text-accent" />
              <span className="mt-0.5 text-xs text-text-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* [3] 카테고리별 의뢰 현황 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <CategoryBrowse
          categoryCounts={stats.categoryCounts}
          newRequestsThisMonth={stats.newRequestsThisMonth}
          title="어떤 분야의 의뢰가 있나요?"
          countLabel="의뢰"
          countUnit="건"
          colorToken="accent"
          baseHref="/requests"
        />
      </section>

      {/* [4] 전문가 역량 강화 프로그램 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <h2 className="text-lg md:text-xl font-bold text-text">경험에 AI를 더합니다</h2>
        <p className="mt-1 text-sm text-text-muted">전문가 역량 강화 프로그램</p>
        <div className="mt-3 flex flex-col gap-3">
          {education.map((pkg) => (
            <div
              key={pkg.slug}
              className="rounded-xl border border-border-light p-4 md:p-5 lg:p-6 shadow-xs"
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
                  className="rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-accent/30 hover:text-accent"
                >
                  자세히 보기
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* [5] 신뢰 배지 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {[
            { title: '수수료 0%', desc: '작업료 전액 지급' },
            { title: '에스크로', desc: '보장결제' },
            { title: '전문가 직접', desc: '매칭' },
          ].map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-center rounded-xl border border-border-light bg-white p-4 md:p-5 text-center shadow-xs"
            >
              <span className="text-sm font-bold text-accent">{badge.title}</span>
              <span className="mt-0.5 text-xs text-text-muted">{badge.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* [6] CTA 반복 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
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

      {/* [7] 크로스링크 배너 */}
      <section className="responsive-container px-4 md:px-6 py-4">
        <a
          href={ownerUrl}
          className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5 transition-colors hover:bg-primary/10"
        >
          <div>
            <p className="text-sm font-semibold text-text">기업을 운영하고 계신가요?</p>
            <p className="mt-0.5 text-xs text-text-muted">검증된 시니어 전문가에게 일을 맡기세요</p>
          </div>
          <span className="text-sm font-medium text-primary shrink-0">&rarr;</span>
        </a>
      </section>

      {/* [8] 푸터 */}
      <footer className="responsive-container px-4 md:px-6 py-6">
        <div className="flex justify-center gap-4 text-xs text-text-subtle">
          <a href={`${adminUrl}/service`} className="hover:text-text-muted transition-colors">서비스 안내</a>
          <a href={ownerUrl} className="hover:text-text-muted transition-colors">기업공간</a>
          <a href={`${adminUrl}/privacy`} className="hover:text-text-muted transition-colors">개인정보처리방침</a>
        </div>
      </footer>
    </div>
  )
}
