import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { OwnerDashboard } from './owner-dashboard'
import { OAuthButtons } from '@jisane/ui/oauth-buttons'
import { fetchOwnerLandingStats } from '@jisane/shared/landing-stats'
import { getPackagesByAudience } from '@jisane/shared/service-package/queries'
import { pickShowcase } from '@jisane/shared/service-package/showcase'
import { formatPackagePrice, CATEGORY_LABELS, PILLAR_LABELS, PILLAR_ORDER } from '@jisane/shared/service-catalog'
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { ServiceCarousel, type ServiceCarouselItem } from '@jisane/ui/service-carousel'
import { SectionHeader } from '@jisane/ui/section-header'
import { OwlIcon } from '@jisane/ui/icons/owl'
import { ScrollReveal } from '@jisane/ui/scroll-reveal'
import { HeroBackdrop } from '@jisane/ui/hero-backdrop'
import { TextRotator } from '@jisane/ui/text-rotator'
import { ADMIN_URL, EXPERT_URL } from '@/lib/urls'

export default async function OwnerHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  // 로그인 상태: 홈을 개인화 대시보드로 (redirect 없이 홈 유지)
  if (user) {
    const { data: owner } = await adminClient
      .from('owner')
      .select('id, email, company')
      .eq('auth_user_id', user.id)
      .single()
    if (owner) {
      return <OwnerDashboard ownerId={owner.id} email={owner.email} company={owner.company} />
    }
  }

  const stats = await fetchOwnerLandingStats()
  const services = await getPackagesByAudience('owner')
  const adminUrl = ADMIN_URL
  const expertUrl = EXPERT_URL

  // 랜딩 ①은 전체 지식서비스(46)의 대표(featured→최신)를 배너 캐러셀로 — 전체는 /services.
  const showcase: ServiceCarouselItem[] = pickShowcase(services, 9).map((pkg) => ({
    key: pkg.slug,
    href: `/services/${pkg.slug}`,
    name: pkg.name,
    provider: pkg.provider,
    bannerUrl: pkg.bannerUrl ?? null,
    priceLabel: formatPackagePrice(pkg),
    categoryLabel: CATEGORY_LABELS[pkg.category],
    isOfficial: pkg.isOfficial,
    isFree: pkg.isFree,
  }))

  return (
    <div className="landing-snap flex flex-1 flex-col items-center">
      {/* [1] 히어로 — 브랜드 딥그린 다크 밴드 */}
      <div className="hero-dark w-full snap-section">
        <HeroBackdrop intensity="hero" />
        <section className="hero-parallax-content container-marketing relative z-10 flex flex-col items-center gap-4 px-4 md:px-6 pt-14 md:pt-20 pb-12 md:pb-16 text-center">
          <span className="hero-eyebrow animate-slide-up stagger-1">기업의 곁에, 언제나 당신곁에</span>
          <h1 className="text-display text-white animate-slide-up stagger-2">
            지역 기업의 든든한
            <br />
            성장{' '}
            <TextRotator
              words={['파트너', '동반자', '길잡이']}
              className="text-accent-light"
              buttonClassName="text-white/50 hover:text-white/90"
            />
          </h1>
          <p className="text-base md:text-lg text-white/75 animate-slide-up stagger-3">
            부울경 중소기업에 필요한 전문 서비스와 시니어 전문가 정보 제공
          </p>
        </section>
      </div>

      {/* [2] ① 기업 지식서비스 — 배너 캐러셀(대표3+살짝가림), 전체 → /services */}
      <ScrollReveal className="w-full snap-section">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <SectionHeader sticky num={1} tone="primary" title="기업 지식서비스" subtitle="기업 운영에 바로 쓰는 전문 서비스" />
          {showcase.length > 0 ? (
            <ServiceCarousel items={showcase} seeAllHref={`${adminUrl}/knowledge`} />
          ) : (
            <p className="text-sm text-text-muted">준비 중입니다.</p>
          )}
        </section>
      </ScrollReveal>

      {/* [3] ② 시니어 전문가 정보 — 풀블리드 warm */}
      <ScrollReveal className="w-full snap-section">
        <div className="w-full bg-surface-warm py-8 md:py-12">
          <section className="container-marketing px-4 md:px-6">
            <SectionHeader sticky num={2} tone="accent" title="시니어 전문가 정보" subtitle="경험과 노하우를 갖춘 분야별 전문가" />
            <CategoryBrowse
              categoryCounts={stats.categoryCounts}
              newRequestsThisMonth={stats.newRequestsThisMonth}
              title="어떤 분야의 전문가가 필요하세요?"
              countLabel="전문가"
              countUnit="명"
              colorToken="primary"
              baseHref="/experts"
            />
          </section>
        </div>
      </ScrollReveal>

      {/* [4] ③ 5대 지원 분류로 찾기 — 서비스 검색 분류(칩) */}
      <ScrollReveal className="w-full snap-section">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <SectionHeader sticky num={3} tone="primary" title="5대 지원 분류로 찾기" subtitle="필요한 지원 분야를 골라 서비스를 탐색하세요" />
          <div className="flex flex-wrap gap-2">
            {PILLAR_ORDER.map((code) => (
              <Link
                key={code}
                href={`/services?pillar=${code}`}
                className="rounded-full border border-border-light bg-card px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
              >
                {PILLAR_LABELS[code]}
              </Link>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* [5] 회원가입/로그인 CTA — 하단 */}
      <ScrollReveal className="w-full snap-section">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <div className="rounded-2xl bg-primary/10 p-6 md:p-8">
            <p className="mb-5 text-center text-base md:text-lg font-semibold text-text leading-relaxed">
              전문 서비스와 전문가 정보, 지금 시작하세요
            </p>
            <OAuthButtons signInWithKakao={signInWithKakao} signInWithGoogle={signInWithGoogle} />
          </div>
        </section>
      </ScrollReveal>

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
            <a href={`${adminUrl}/ax`} className="inline-flex min-h-6 items-center hover:text-text-muted transition-colors">AX 전환</a>
            <a href={expertUrl} className="inline-flex min-h-6 items-center hover:text-text-muted transition-colors">시니어지식인회원</a>
            <a href={`${adminUrl}/privacy`} className="inline-flex min-h-6 items-center hover:text-text-muted transition-colors">개인정보처리방침</a>
          </div>
          <p className="text-xs text-text-subtle">&copy; {new Date().getFullYear()} (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
