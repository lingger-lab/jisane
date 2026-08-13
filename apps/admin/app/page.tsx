import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { fetchHubLandingStats } from '@jisane/shared/landing-stats'
import { SplashOverlay } from '@/components/splash-overlay'
import { OwlIcon } from '@jisane/ui/icons/owl'
import { OWNER_URL, EXPERT_URL } from '@/lib/urls'

export default async function AdminHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user && (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes((user.email || '').toLowerCase())

  const expertUrl = EXPERT_URL
  const ownerUrl = OWNER_URL

  const stats = await fetchHubLandingStats()

  // 인기 분야 (시니어지식인 수 기준 상위 4개 대분류)
  const topExpertMajors = [...stats.owner.categoryCounts]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((c) => c.label)

  // 의뢰 많은 분야 (의뢰 수 기준 상위 4개 대분류)
  const topRequestMajors = [...stats.expert.categoryCounts]
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)
    .map((c) => c.label)

  return (
    <div className="flex flex-1 flex-col">
      {/* 네비게이션 */}
      <nav className="container-marketing flex items-center justify-end gap-3 px-4 md:px-6 py-2">
        <Link href="/ax" className="text-xs text-text-muted hover:text-text transition-colors">AX 전환</Link>
        <Link href="/service" className="text-xs text-text-muted hover:text-text transition-colors">서비스 안내</Link>
        {isAdmin && (
          <Link href="/dashboard" className="text-xs text-accent font-medium hover:text-accent/80 transition-colors">관리자</Link>
        )}
      </nav>

      <SplashOverlay />

      {/* 히어로 — 브랜드 딥그린 다크 밴드 (렐라랩 벤치마킹: 아이브로우→제목→서브→수치) */}
      <div className="hero-dark w-full">
        <section className="container-marketing flex flex-col items-center gap-4 px-4 md:px-6 pt-14 md:pt-20 pb-12 md:pb-16 text-center animate-fade-in">
          <span className="hero-eyebrow">기업의 곁에, 언제나 당신곁에</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-white leading-snug">
            지역 기업의 든든한
            <br />
            <span className="text-accent-light">성장</span> 파트너
          </h1>
          <p className="text-base md:text-lg text-white/75 leading-relaxed">
            중소기업 전문 서비스와 시니어 전문가 정보를 한곳에서.
          </p>
          <p className="text-xs text-white/50">
            {stats.owner.totalMajorFields}개 전문 분야 · 전문가 {stats.owner.totalExperts}명
          </p>
        </section>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 md:px-6 py-10 md:py-14">
        <main className="container-marketing flex flex-col items-center gap-10 md:gap-14 lg:gap-16">
          {/* 공간 선택 카드 */}
          <section className="w-full animate-fade-in stagger-1">
            {/* 외곽 패널(bg-surface-warm) 제거 — 패널 테두리+카드 테두리 2중 프레임/회색 화면 원인.
                카드들은 페이지 배경 위에 각자 단일 테두리로. */}
            <div className="flex flex-col gap-4">
              <a
                href={ownerUrl}
                className="rounded-2xl border border-border-light bg-card p-6 md:p-8 text-left shadow-sm card-hover transition-all"
              >
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-primary">기업회원</h2>
                <p className="mt-2 text-sm md:text-base text-text-muted">기업 운영에 필요한 전문 서비스와 시니어 전문가 정보</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">전문 서비스</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">전문가 정보</span>
                </div>
                {topExpertMajors.length > 0 && (
                  <p className="mt-3 text-xs text-text-subtle">
                    인기 분야: {topExpertMajors.join(' / ')}
                  </p>
                )}
                <div className="mt-4 text-sm font-semibold text-primary">기업회원 바로가기 &rarr;</div>
              </a>

              <a
                href={expertUrl}
                className="rounded-2xl border border-border-light bg-card p-6 md:p-8 text-left shadow-sm card-hover transition-all"
              >
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-accent">시니어지식인회원</h2>
                <p className="mt-2 text-sm md:text-base text-text-muted">경험과 노하우로 지역 기업과 협력</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">열린 의뢰 {stats.expert.totalOpenRequests}건</span>
                  <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">전문 도구</span>
                </div>
                {topRequestMajors.length > 0 && (
                  <p className="mt-3 text-xs text-text-subtle">
                    의뢰 많은 분야: {topRequestMajors.join(' / ')}
                  </p>
                )}
                <div className="mt-4 text-sm font-semibold text-accent">시니어지식인회원 바로가기 &rarr;</div>
              </a>

              {/* 전문가회원(파트너) — 특수관계 제공기관용 (기업·시니어와 동일 구조) */}
              <Link
                href="/partner"
                className="rounded-2xl border border-border-light bg-card p-6 md:p-8 text-left shadow-sm card-hover transition-all"
              >
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-info">전문가회원(파트너)</h2>
                <p className="mt-2 text-sm md:text-base text-text-muted">
                  전문서비스를 제공하는 특수관계 회원 — 기업 또는 시니어지식인 — 서비스 등록 · 신청 관리
                </p>
                <div className="mt-4 text-sm font-semibold text-info">전문가회원(파트너) 바로가기 &rarr;</div>
              </Link>
            </div>
          </section>

        </main>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-border-light bg-surface py-6">
        <div className="container-marketing flex flex-col gap-4 px-4 md:px-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <OwlIcon className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-semibold text-brand-gradient">지사네</p>
                <p className="text-xs text-text-subtle">지식나눔 사업협력 네트워크</p>
              </div>
            </div>
            <p className="text-xs text-text-subtle">운영: (주)지사네</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
            <span>사업자등록번호: 405-02-46113</span>
            <span>이메일: iamblackwhite86@gmail.com</span>
          </div>
          {/* min-h-6: 24×24px 최소 타깃(WCAG 2.5.8) */}
          <div className="flex gap-3 text-xs">
            <Link href="/privacy" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">개인정보처리방침</Link>
            <Link href="/service" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">서비스 안내</Link>
            <Link href="/standard/scope" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">거래 표준</Link>
            <Link href="/ax" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">AX 전환</Link>
          </div>
          <hr className="border-border-light" />
          <p className="text-xs text-text-subtle">&copy; 2026 (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
