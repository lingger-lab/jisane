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
import { getPackagesByAudience } from '@jisane/shared/service-package/queries'
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { OwlIcon } from '@jisane/ui/icons/owl'
import { ScrollReveal } from '@jisane/ui/scroll-reveal'

// 시니어 작업에 필요한 전문 도구 — 무료 S/W를 미끼로, 고급 도구는 유료.
const EXPERT_TOOLS = [
  {
    name: '지사네 업무 S/W',
    badge: '무료',
    desc: '의뢰 관리 · 문서 작성 · 정산까지 기본 도구 무료 제공',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    name: 'AI 작업 도구 (프로)',
    badge: '유료',
    desc: '제안서 · 보고서 AI 초안, 고급 분석 템플릿',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
        <path d="M19 15l.7 1.9 1.8.7-1.8.7L19 20l-.7-1.7-1.8-.7 1.8-.7z" />
      </svg>
    ),
  },
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
      return <ExpertDashboard expertId={expert.id} name={expert.name} field={expert.field} />
    }
    // 신규 시니어지식인: 온보딩(프로필 등록)으로
    redirect('/register')
  }

  const stats = await fetchExpertLandingStats()
  const education = await getPackagesByAudience('expert')
  const adminUrl = ADMIN_URL
  const ownerUrl = OWNER_URL

  return (
    <div className="flex flex-1 flex-col items-center">
      {/* [1] 히어로 — 브랜드 딥그린 다크 밴드 */}
      <div className="hero-dark w-full">
        <section className="container-marketing flex flex-col items-center gap-4 px-4 md:px-6 pt-14 md:pt-20 pb-12 md:pb-16 text-center animate-fade-in">
          <span className="hero-eyebrow">당신의 경험, 지역 기업의 힘</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-white leading-snug">
            경험의 값어치,
            <br />
            <span className="text-accent-light">온전히</span> 받으세요.
          </h1>
          <p className="text-base md:text-lg text-white/75">
            기업 의뢰 정보와 작업에 필요한 전문 도구를 한곳에서
          </p>
        </section>
      </div>

      {/* [2] ① 기업 의뢰 정보 */}
      <ScrollReveal className="w-full">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <header className="mb-5 flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-serif text-base font-bold text-white">1</span>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-serif text-text leading-tight">기업 의뢰 정보</h2>
              <p className="mt-0.5 text-sm text-text-muted">지금 열린 기업의 협력 요청</p>
            </div>
          </header>
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

      {/* [3] ② 작업에 필요한 전문 도구 — 풀블리드 warm */}
      <ScrollReveal className="w-full">
        <div className="w-full bg-surface-warm py-8 md:py-12">
          <section className="container-marketing px-4 md:px-6">
            <header className="mb-5 flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary font-serif text-base font-bold text-white">2</span>
              <div>
                <h2 className="text-xl md:text-2xl font-bold font-serif text-text leading-tight">작업에 필요한 전문 도구</h2>
                <p className="mt-0.5 text-sm text-text-muted">시니어 작업을 돕는 S/W 도구</p>
              </div>
            </header>
            <div className="flex flex-col gap-3">
              {EXPERT_TOOLS.map((tool) => (
                <div key={tool.name} className="flex items-start gap-3 rounded-xl border border-border-light bg-white p-4 shadow-xs">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent [&>svg]:h-[18px] [&>svg]:w-[18px]">
                    {tool.icon}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-text">{tool.name}</p>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          tool.badge === '무료' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                        }`}
                      >
                        {tool.badge}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-text-muted">{tool.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </ScrollReveal>

      {/* [4] ③ 지사네가 제공하는 시니어 전문 서비스 — 역량 강화·교육 */}
      <ScrollReveal className="w-full">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <header className="mb-5 flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent font-serif text-base font-bold text-white">3</span>
            <div>
              <h2 className="text-xl md:text-2xl font-bold font-serif text-text leading-tight">지사네가 제공하는 시니어 전문 서비스</h2>
              <p className="mt-0.5 text-sm text-text-muted">역량 강화 · 교육 프로그램</p>
            </div>
          </header>
          <div className="flex flex-col gap-3">
            {education.map((pkg) => (
              <Link
                key={pkg.slug}
                href={`/education/${pkg.slug}`}
                className="rounded-xl border border-border-light bg-white p-4 md:p-5 shadow-xs transition-colors hover:border-accent/30"
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
          </div>
        </section>
      </ScrollReveal>

      {/* [5] 회원가입/로그인 CTA — 하단 */}
      <ScrollReveal className="w-full">
        <section className="container-marketing px-4 md:px-6 py-8 md:py-12">
          <div className="rounded-2xl bg-accent/10 p-6 md:p-8">
            <p className="mb-5 text-center text-base md:text-lg font-semibold text-text leading-relaxed">
              지금 등록하고 열린 의뢰 {stats.totalOpenRequests}건을 확인하세요
            </p>
            <OAuthButtons signInWithKakao={signInWithKakao} signInWithGoogle={signInWithGoogle} />
          </div>
        </section>
      </ScrollReveal>

      {/* [6] 크로스링크 배너 */}
      <section className="container-marketing px-4 md:px-6 py-6 md:py-8">
        <a
          href={ownerUrl}
          className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-5 md:p-6 transition-colors hover:bg-primary/10"
        >
          <div>
            <p className="text-base font-semibold text-text">기업을 운영하고 계신가요?</p>
            <p className="mt-1 text-sm text-text-muted">전문 서비스와 시니어 전문가 정보 보기</p>
          </div>
          <span className="text-sm font-medium text-primary shrink-0">&rarr;</span>
        </a>
      </section>

      {/* [7] 푸터 */}
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
          <p className="text-xs text-text-subtle">&copy; 2026 (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
