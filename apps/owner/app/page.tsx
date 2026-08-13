import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { OwnerDashboard } from './owner-dashboard'
import { OAuthButtons } from '@jisane/ui/oauth-buttons'
import { fetchOwnerLandingStats } from '@jisane/shared/landing-stats'
import { getPackagesByAudience } from '@jisane/shared/service-package/queries'
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { OwlIcon } from '@jisane/ui/icons/owl'
import { ScrollReveal } from '@jisane/ui/scroll-reveal'
import { ADMIN_URL, EXPERT_URL } from '@/lib/urls'

// 지사네가 제공하는 기업 전문 서비스 5대 분류 — 각 서비스를 나타내는 라인 아이콘.
const ENTERPRISE_PILLARS = [
  {
    title: '경영·마케팅 사업화 지원',
    desc: '사업 아이템 구체화 · 시장 진입 전략',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    title: '재무·세무·회계 경영컨설팅',
    desc: '자금 · 세무 · 회계 구조 진단과 자문',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8" />
        <path d="M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M8 18h4M16 14v4" />
      </svg>
    ),
  },
  {
    title: '기술·생산 품질관리 지원',
    desc: '생산 공정 · 품질 체계 개선',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
  {
    title: '온라인·홍보 판로개척 지원',
    desc: '온라인 채널 · 홍보로 판로 확대',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
      </svg>
    ),
  },
  {
    title: 'AI·AX 지원',
    desc: 'AI 도입 · 업무 전환(AX)으로 생산성 향상',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="6" height="6" rx="1" /><rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
      </svg>
    ),
  },
] as const

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

  // 랜딩 ①은 featured(추천) 서비스만 노출 — 나머지는 "전체 전문 서비스 둘러보기"(/services)에서.
  // featured 0건이면 섹션이 비지 않게 상위 3개로 폴백.
  const featuredServices = services.filter((s) => s.featured)
  const landingServices = featuredServices.length > 0 ? featuredServices : services.slice(0, 3)

  return (
    <div className="flex flex-1 flex-col items-center">
      {/* [1] 히어로 — 브랜드 딥그린 다크 밴드 */}
      <div className="hero-dark w-full">
        <section className="container-marketing flex flex-col items-center gap-4 px-4 md:px-6 pt-14 md:pt-20 pb-12 md:pb-16 text-center animate-fade-in">
          <span className="hero-eyebrow">기업의 곁에, 언제나 당신곁에</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-white leading-snug">
            지역 기업의
            <br />
            <span className="text-accent-light">든든한</span> 성장 파트너
          </h1>
          <p className="text-base md:text-lg text-white/75">
            부울경 중소기업에 필요한 전문 서비스와 시니어 전문가 정보 제공
          </p>
        </section>
      </div>

      {/* [2] ① 기업 운영 전문 서비스 */}
      <ScrollReveal className="w-full">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <header className="mb-5 flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-serif text-base font-bold text-white">1</span>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-serif text-text leading-tight">기업 운영 전문 서비스</h2>
              <p className="mt-0.5 text-sm text-text-muted">기업 운영에 필요한 전문 서비스 신청</p>
            </div>
          </header>
          <div className="flex flex-col gap-3">
            {landingServices.map((pkg) => (
              <Link
                key={pkg.slug}
                href={`/services/${pkg.slug}`}
                className="rounded-xl border border-border-light bg-card p-4 md:p-5 shadow-xs transition-colors hover:border-primary/30"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-text">{pkg.name}</h3>
                      {pkg.isFree && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">무료</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-text-muted leading-relaxed">{pkg.valueDesc}</p>
                  </div>
                  {pkg.duration && <span className="shrink-0 text-xs text-text-subtle">{pkg.duration}</span>}
                </div>
              </Link>
            ))}
          </div>
          <Link href="/services" className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline">
            전체 전문 서비스 둘러보기 &rarr;
          </Link>
        </section>
      </ScrollReveal>

      {/* [3] ② 시니어 전문가 정보 — 풀블리드 warm */}
      <ScrollReveal className="w-full">
        <div className="w-full bg-surface-warm py-8 md:py-12">
          <section className="container-marketing px-4 md:px-6">
            <header className="mb-5 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-serif text-base font-bold text-white">2</span>
              <div>
                <h2 className="text-xl md:text-2xl font-bold font-serif text-text leading-tight">시니어 전문가 정보</h2>
                <p className="mt-0.5 text-sm text-text-muted">경험과 노하우를 갖춘 분야별 전문가</p>
              </div>
            </header>
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

      {/* [4] ③ 지사네가 제공하는 기업 전문 서비스 (5) */}
      <ScrollReveal className="w-full">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <header className="mb-5 flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-serif text-base font-bold text-white">3</span>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-serif text-text leading-tight">지사네가 제공하는 기업 전문 서비스</h2>
              <p className="mt-0.5 text-sm text-text-muted">지역 기업 성장을 위한 5대 지원</p>
            </div>
          </header>
          <div className="flex flex-col gap-2.5">
            {ENTERPRISE_PILLARS.map((p) => (
              <div key={p.title} className="flex items-start gap-3 rounded-xl border border-border-light bg-card p-4 shadow-xs">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary [&>svg]:h-[18px] [&>svg]:w-[18px]">
                  {p.icon}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-text">{p.title}</p>
                  <p className="mt-0.5 text-sm text-text-muted">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </ScrollReveal>

      {/* [5] 회원가입/로그인 CTA — 하단 */}
      <ScrollReveal className="w-full">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <div className="rounded-2xl bg-primary/10 p-6 md:p-8">
            <p className="mb-5 text-center text-base md:text-lg font-semibold text-text leading-relaxed">
              전문 서비스와 전문가 정보, 지금 시작하세요
            </p>
            <OAuthButtons signInWithKakao={signInWithKakao} signInWithGoogle={signInWithGoogle} />
          </div>
        </section>
      </ScrollReveal>

      {/* [6] 크로스링크 배너 */}
      <section className="container-marketing px-4 md:px-6 py-6 md:py-8">
        <a
          href={expertUrl}
          className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-5 md:p-6 transition-colors hover:bg-accent/10"
        >
          <div>
            <p className="text-base font-semibold text-text">시니어 전문가이신가요?</p>
            <p className="mt-1 text-sm text-text-muted">경험과 노하우로 지역 기업과 협력하세요</p>
          </div>
          <span className="text-sm font-medium text-accent shrink-0">&rarr;</span>
        </a>
      </section>

      {/* [6] 푸터 */}
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
          <p className="text-xs text-text-subtle">&copy; 2026 (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
