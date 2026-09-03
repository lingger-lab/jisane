import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { ExpertDashboard } from './expert-dashboard'
import { OAuthButtons } from '@jisane/ui/oauth-buttons'
import { fetchExpertLandingStats } from '@jisane/shared/landing-stats'
import { ADMIN_URL, OWNER_URL } from '@/lib/urls'
import { getPackagesByAudience, getAllPublishedPackages } from '@jisane/shared/service-package/queries'
import { pickShowcase } from '@jisane/shared/service-package/showcase'
import { formatPackagePrice, CATEGORY_LABELS } from '@jisane/shared/service-catalog'
import { ServiceCarousel, type ServiceCarouselItem } from '@jisane/ui/service-carousel'
import { PartnerAdStrip } from '@jisane/ui/partner-ad-strip'
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { SectionHeader } from '@jisane/ui/section-header'
import { AnimatedCounter } from '@jisane/ui/animated-counter'
import { Badge } from '@jisane/ui/badge'
import { OwlIcon } from '@jisane/ui/icons/owl'
import { ScrollReveal } from '@jisane/ui/scroll-reveal'
import { HeroBackdrop } from '@jisane/ui/hero-backdrop'
import { TextRotator } from '@jisane/ui/text-rotator'

// 지사네가 시니어에게 제공하는 업무 도구 — 교육과 함께 '지사네 제공' 서비스로 동일 카드 스타일 노출.
const EXPERT_TOOLS = [
  { name: '지사네 업무 S/W', badge: '무료', desc: '의뢰 관리 · 문서 작성 · 정산까지 기본 도구 무료 제공' },
  { name: 'AI 작업 도구 (프로)', badge: '유료', desc: '제안서 · 보고서 AI 초안, 고급 분석 템플릿' },
] as const

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
      // 공급자(provider) 연결 여부 — '내 지식서비스' 카드에 본인 등록 서비스를 노출하기 위함
      const { data: provider } = await adminClient
        .from('provider')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      return (
        <ExpertDashboard
          expertId={expert.id}
          name={expert.name}
          field={expert.field}
          providerId={(provider?.id as string | undefined) ?? null}
        />
      )
    }
    // 신규 시니어지식인: 온보딩(프로필 등록)으로
    redirect('/register')
  }

  const stats = await fetchExpertLandingStats()
  const education = await getPackagesByAudience('expert')
  const catalog = await getAllPublishedPackages()
  const showcase: ServiceCarouselItem[] = pickShowcase(catalog, 9).map((pkg) => ({
    key: pkg.slug,
    href: `${ADMIN_URL}/knowledge/${pkg.slug}`,
    name: pkg.name,
    provider: pkg.provider,
    bannerUrl: pkg.bannerUrl ?? null,
    priceLabel: formatPackagePrice(pkg),
    categoryLabel: CATEGORY_LABELS[pkg.category],
    isOfficial: pkg.isOfficial,
    isFree: pkg.isFree,
  }))
  const adminUrl = ADMIN_URL
  const ownerUrl = OWNER_URL

  return (
    <div className="landing-snap flex flex-1 flex-col items-center">
      {/* [1] 히어로 — 브랜드 딥그린 다크 밴드 */}
      <div className="hero-dark w-full snap-section">
        <HeroBackdrop intensity="hero" />
        <section className="hero-parallax-content container-marketing relative z-10 flex flex-col items-center gap-4 px-4 md:px-6 pt-14 md:pt-20 pb-12 md:pb-16 text-center">
          <span className="hero-eyebrow animate-slide-up stagger-1">당신의 경험, 지역 기업의 힘</span>
          <h1 className="text-display text-white animate-slide-up stagger-2">
            경험의 값어치, 온전히
            <br />
            <TextRotator
              words={['받으세요', '누리세요', '챙기세요']}
              className="text-accent-light"
              buttonClassName="text-white/50 hover:text-white/90"
            />
          </h1>
          <p className="text-base md:text-lg text-white/75 animate-slide-up stagger-3">
            기업 의뢰 정보와 작업에 필요한 전문 도구를 한곳에서
          </p>
        </section>
      </div>

      {/* [2] ① 기업 의뢰 정보 */}
      <ScrollReveal className="w-full snap-section">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <SectionHeader sticky num={1} tone="accent" title="기업 의뢰 정보" subtitle="지금 열린 기업의 협력 요청" />
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

      {/* [3] ② 지사네 지식서비스 — 배너 캐러셀(대표+전체보기 → /knowledge) */}
      <ScrollReveal className="w-full snap-section">
        <div className="w-full bg-surface-warm py-8 md:py-12">
          <section className="container-marketing px-4 md:px-6">
            <SectionHeader sticky num={2} tone="primary" title="지사네 지식서비스" subtitle="지사네가 제공하는 전문 서비스를 만나보세요" />
            {showcase.length > 0 ? (
              <ServiceCarousel items={showcase} seeAllHref={`${adminUrl}/knowledge`} />
            ) : (
              <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-light bg-card py-10 text-center">
                <OwlIcon className="h-8 w-8 text-primary/40" />
                <p className="text-sm text-text-muted">곧 지식서비스가 열립니다.</p>
              </div>
            )}
            <div className="mt-4 text-center">
              <a href="#expert-join" className="text-sm font-medium text-primary hover:underline">
                경험을 서비스로 — 지금 등록하고 여세요 →
              </a>
            </div>
          </section>
        </div>
      </ScrollReveal>

      {/* [4] ③ 지사네가 제공하는 시니어 전문 서비스 — 역량 강화·교육 + 업무 도구 */}
      <ScrollReveal className="w-full snap-section">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <SectionHeader sticky num={3} tone="accent" title="지사네가 제공하는 시니어 전문 서비스" subtitle="역량 강화 · 교육 · 업무 도구" />
          {/* 교육 pkg + 업무 도구를 동일한 카드 스타일로 통합(별도 '업무 도구' 라벨·아이콘칩 제거) */}
          <div className="reveal-cards flex flex-col gap-3">
            {education.map((pkg) => (
              <Link
                key={pkg.slug}
                href={`/education/${pkg.slug}`}
                className="rounded-xl border border-border-light bg-card p-4 md:p-5 shadow-xs card-hover transition-colors hover:border-accent/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text">{pkg.name}</h3>
                    <p className="mt-1 text-sm text-text-muted leading-relaxed">{pkg.valueDesc}</p>
                  </div>
                  {pkg.duration && <span className="shrink-0 text-xs text-text-subtle">{pkg.duration}</span>}
                </div>
              </Link>
            ))}
            {EXPERT_TOOLS.map((tool) => (
              <div
                key={tool.name}
                className="rounded-xl border border-border-light bg-card p-4 md:p-5 shadow-xs card-hover transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-text">{tool.name}</h3>
                    <p className="mt-1 text-sm text-text-muted leading-relaxed">{tool.desc}</p>
                  </div>
                  <Badge variant={tool.badge === '무료' ? 'primary' : 'accent'}>{tool.badge}</Badge>
                </div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* [5] 회원가입/로그인 CTA — 하단 */}
      <ScrollReveal className="w-full snap-section">
        <section id="expert-join" className="container-marketing px-4 md:px-6 py-8 md:py-12 scroll-mt-16">
          <div className="rounded-2xl bg-accent/10 p-6 md:p-8">
            <p className="mb-5 text-center text-base md:text-lg font-semibold text-text leading-relaxed">
              지금 등록하고 열린 의뢰 <AnimatedCounter end={stats.totalOpenRequests} suffix="건" />을 확인하세요
            </p>
            <OAuthButtons signInWithKakao={signInWithKakao} signInWithGoogle={signInWithGoogle} />
          </div>
        </section>
      </ScrollReveal>

      <PartnerAdStrip className="py-8" />

      {/* 푸터 (회원 전환은 헤더 "회원 전환" 메뉴로 이동) */}
      <footer className="w-full border-t border-border-light py-6">
        <div className="container-marketing flex flex-col gap-4 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <OwlIcon className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm font-semibold text-brand-gradient">지사네</p>
              <p className="text-xs text-text-subtle">지식나눔 사업협력 네트워크</p>
            </div>
          </div>
          {/* min-h-6: 24×24px 최소 타깃(WCAG 2.5.8) */}
          <div className="flex flex-wrap gap-3 text-xs text-text-subtle">
            <a href={`${adminUrl}/service`} className="inline-flex min-h-6 items-center hover:text-text-muted transition-colors">서비스 안내</a>
            <a href={ownerUrl} className="inline-flex min-h-6 items-center hover:text-text-muted transition-colors">기업회원</a>
            <a href={`${adminUrl}/privacy`} className="inline-flex min-h-6 items-center hover:text-text-muted transition-colors">개인정보처리방침</a>
          </div>
          <p className="text-xs text-text-subtle">&copy; {new Date().getFullYear()} (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
