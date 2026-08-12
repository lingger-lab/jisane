import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { ExpertDashboard } from './expert-dashboard'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { fetchExpertLandingStats } from '@jisane/shared/landing-stats'
import { ADMIN_URL, OWNER_URL } from '@/lib/urls'
import { getPackagesByAudience } from '@jisane/shared/service-package/queries'
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { CollapsibleSection } from '@jisane/ui/collapsible-section'
import { AnimatedCounter } from '@jisane/ui/animated-counter'
import { OwlIcon } from '@jisane/ui/icons/owl'
import { ScrollReveal } from '@jisane/ui/scroll-reveal'

export default async function ExpertHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // 로그인 상태: 홈을 개인화 대시보드로 (redirect 없이 홈 유지)
  if (user) {
    const { data: expert } = await adminClient
      .from('expert')
      .select('id, name, field')
      .eq('auth_user_id', user.id)
      .single()

    if (expert) {
      return <ExpertDashboard expertId={expert.id} name={expert.name} field={expert.field} />
    }
    // 신규 시니어지식인: 온보딩(프로필 등록)으로
    redirect('/register')
  }

  const stats = await fetchExpertLandingStats()
  const education = await getPackagesByAudience('expert')
  const adminUrl = ADMIN_URL
  const ownerUrl = OWNER_URL

  // 핵심 수치 (완료거래 0이면 3칸)
  const metrics: { end: number; suffix: string; label: string }[] = [
    { end: stats.totalOwners, suffix: '+', label: '참여 기업' },
    { end: stats.totalOpenRequests, suffix: '건', label: '열린 의뢰' },
    { end: 0, suffix: '%', label: '수수료' },
  ]
  if (stats.totalCompletedDeals > 0) {
    metrics.push({ end: stats.totalCompletedDeals, suffix: '건', label: '완료 거래' })
  }

  return (
    <div className="flex flex-1 flex-col items-center">
      {/* [1] 히어로 — 브랜드 딥그린 다크 밴드 + 0% 배지 */}
      <div className="hero-dark w-full">
        <section className="responsive-container flex flex-col items-center gap-4 px-4 md:px-6 pt-14 md:pt-20 pb-12 md:pb-16 text-center animate-fade-in">
          <span className="hero-eyebrow">당신의 30년, AI로 증폭하다 · 시니어지식인회원</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-white leading-snug">
            경험의 값어치,
            <br />
            <span className="text-accent-light">온전히</span> 받으세요.
          </h1>

          {/* 0% 수수료 배지 — 다크 배경 위 버전 */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2">
            <span className="text-2xl md:text-3xl font-bold text-accent-light">0%</span>
            <span className="text-sm font-medium text-white/90">수수료 — 작업료 전액 직접 정산</span>
          </div>

          <div className="flex w-full flex-col gap-3 mt-2">
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
      </div>

      {/* [2] 핵심 수치 — 풀블리드 배경 */}
      <ScrollReveal className="w-full">
      <div className="w-full bg-surface-warm py-8 md:py-12">
        <section className="responsive-container px-4 md:px-6">
          <div className={`grid gap-3 md:gap-4 ${metrics.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col items-center rounded-xl bg-white p-5 md:p-6 shadow-xs">
                <AnimatedCounter end={m.end} suffix={m.suffix} className="text-3xl md:text-4xl font-bold text-accent" />
                <span className="mt-1 text-sm text-text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
      </ScrollReveal>

      {/* [2.5] 이런 경험, 있으셨나요? — 고통 언어화 */}
      <ScrollReveal className="w-full">
      <section className="responsive-container px-4 md:px-6 py-8 md:py-12">
        <div className="rounded-xl border-t-4 border-t-warning bg-surface-warm p-5 md:p-6">
          <p className="text-base font-bold text-text">이런 경험, 있으셨나요?</p>
          <ul className="mt-3 flex flex-col gap-3 text-sm md:text-base text-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">&mdash;</span>
              수수료 30%가 빠지고 나서야 정산 내역을 받았다
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">&mdash;</span>
              작업을 끝냈는데 대금이 한 달째 입금되지 않았다
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">&mdash;</span>
              프로필 한 장으로 30년 경험을 증명해야 했다
            </li>
          </ul>
          <p className="mt-4 text-xs md:text-sm text-text-subtle">
            플랫폼의 구조가 달라지면, 같은 실력도 다른 대우를 받습니다.
          </p>
        </div>
      </section>
      </ScrollReveal>

      {/* [3] 카테고리별 의뢰 현황 */}
      <ScrollReveal className="w-full">
      <section className="responsive-container px-4 md:px-6 py-8 md:py-12">
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
      </ScrollReveal>

      {/* [3.5] 비교해보세요 — 풀블리드 배경 */}
      <ScrollReveal className="w-full">
      <div className="w-full bg-white py-8 md:py-12">
        <section className="responsive-container px-4 md:px-6">
          <h2 className="text-xl md:text-2xl font-bold text-text">비교해보세요</h2>
          <div className="mt-4 flex flex-col gap-4">
            {[
              { old: '수수료 20~30%를 떼고 정산한다', jisane: '수수료 0% — 작업료 전액을 당신 통장으로' },
              { old: '작업 완료 후에도 입금이 불확실하다', jisane: '에스크로 선입금 — 기업이 먼저 입금해야 작업 시작' },
              { old: '매칭 기준이 불명확하다', jisane: '매칭 점수 6항목을 투명하게 공개' },
            ].map((row) => (
              <div key={row.old} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-error-light border border-error/10 p-4 md:p-5">
                  <p className="text-xs md:text-sm font-medium text-error">감추는 관행</p>
                  <p className="mt-1 text-sm text-text-muted">{row.old}</p>
                </div>
                <div className="rounded-xl bg-success-light border border-success/10 p-4 md:p-5">
                  <p className="text-xs md:text-sm font-medium text-success">지사네</p>
                  <p className="mt-1 text-sm text-text-muted">{row.jisane}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
      </ScrollReveal>

      {/* [4] 시니어지식인 역량 강화 프로그램 — 풀블리드 배경, 클릭 시 펼침 */}
      <ScrollReveal className="w-full">
      <div className="w-full bg-accent/5 py-8 md:py-12">
        <section className="responsive-container px-4 md:px-6">
          <CollapsibleSection
            title="당신의 30년, AI로 증폭하다"
            subtitle="경험 × AI = 증폭 — 역량 강화 프로그램"
          >
            <div className="flex flex-col gap-4">
            {education.map((pkg) => (
              <div
                key={pkg.slug}
                className="rounded-xl border border-border-light border-t-4 border-t-accent bg-white p-5 md:p-6 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-text">{pkg.name}</h3>
                    <p className="mt-1 text-sm text-text-muted leading-relaxed">
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
          </CollapsibleSection>
        </section>
      </div>
      </ScrollReveal>

      {/* [5] 신뢰 배지 — 풀블리드 배경 (교육 섹션과 연속 동일색 방지 위해 화이트) */}
      <ScrollReveal className="w-full">
      <div className="w-full bg-white py-8 md:py-12">
        <section className="responsive-container px-4 md:px-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
            {([
              { title: '수수료 0%', desc: '작업료 전액 · 당신 통장으로 직접 정산', href: '' },
              { title: '에스크로 선입금', desc: '기업이 먼저 입금 · 작업 전 대금 확보', href: `${adminUrl}/standard/guarantee` },
              { title: '매칭 점수 공개', desc: '카테고리·경력·실적 6항목 점수 투명 공개', href: '' },
            ]).map((badge) => {
              const card = (
                <div
                  className={`flex h-full flex-col items-center rounded-xl border border-border-light bg-white p-5 md:p-6 text-center shadow-sm${badge.href ? ' transition-colors hover:border-accent/30' : ''}`}
                >
                  <span className="text-base md:text-lg font-bold text-accent">{badge.title}</span>
                  <span className="mt-1 text-xs md:text-sm text-text-muted">{badge.desc}</span>
                </div>
              )
              return badge.href ? (
                <a key={badge.title} href={badge.href} className="h-full">{card}</a>
              ) : (
                <div key={badge.title} className="h-full">{card}</div>
              )
            })}
          </div>
        </section>
      </div>
      </ScrollReveal>

      {/* [6] CTA 반복 */}
      <ScrollReveal className="w-full">
      <section className="responsive-container px-4 md:px-6 py-8 md:py-12">
        <div className="rounded-2xl bg-accent/10 p-6 md:p-8">
          <p className="mb-4 text-center text-base md:text-lg font-semibold text-text leading-relaxed">
            등록 후 열린 의뢰 {stats.totalOpenRequests}건을 확인하세요
          </p>
          <p className="mb-5 text-center text-sm text-text-muted">수수료 0% · 작업료 전액 직접 정산</p>
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
        </div>
      </section>
      </ScrollReveal>

      {/* [7] 크로스링크 배너 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <a
          href={ownerUrl}
          className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-5 md:p-6 transition-colors hover:bg-primary/10"
        >
          <div>
            <p className="text-base font-semibold text-text">기업을 운영하고 계신가요?</p>
            <p className="mt-1 text-sm text-text-muted">매칭비 사전 공개 · 에스크로 직거래 · 수수료 구조 투명</p>
          </div>
          <span className="text-sm font-medium text-primary shrink-0">&rarr;</span>
        </a>
      </section>

      {/* [8] 푸터 */}
      <footer className="w-full border-t border-border-light py-6">
        <div className="responsive-container flex flex-col gap-4 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <OwlIcon className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold text-brand-gradient">지사네</p>
              <p className="text-xs text-text-subtle">일은 사람이 합니다</p>
            </div>
          </div>
          {/* min-h-6: 24×24px 최소 타깃(WCAG 2.5.8) */}
          <div className="flex flex-wrap gap-3 text-xs text-text-subtle">
            <a href={`${adminUrl}/service`} className="inline-flex min-h-6 items-center hover:text-text-muted transition-colors">서비스 안내</a>
            <a href={ownerUrl} className="inline-flex min-h-6 items-center hover:text-text-muted transition-colors">기업회원</a>
            <a href={`${adminUrl}/privacy`} className="inline-flex min-h-6 items-center hover:text-text-muted transition-colors">개인정보처리방침</a>
          </div>
          <p className="text-xs text-text-subtle">&copy; 2026 (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
