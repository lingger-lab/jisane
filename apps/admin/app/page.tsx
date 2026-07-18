import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { fetchHubLandingStats } from '@jisane/shared/landing-stats'
import { SplashOverlay } from '@/components/splash-overlay'
import { OwlIcon } from '@jisane/ui/icons/owl'

export default async function AdminHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user && (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes((user.email || '').toLowerCase())

  const expertUrl = process.env.NEXT_PUBLIC_EXPERT_URL || 'https://expert.jisane.cloud'
  const ownerUrl = process.env.NEXT_PUBLIC_OWNER_URL || 'https://owner.jisane.cloud'

  const stats = await fetchHubLandingStats()

  // 인기 분야 (전문가 수 기준 상위 4개 대분류)
  const topExpertMajors = [...stats.owner.categoryCounts]
    .sort((a, b) => {
      const aSum = a.midCategories.reduce((s, m) => s + m.count, 0)
      const bSum = b.midCategories.reduce((s, m) => s + m.count, 0)
      return bSum - aSum
    })
    .slice(0, 4)
    .map((c) => c.majorLabel)

  // 의뢰 많은 분야 (의뢰 수 기준 상위 4개 대분류)
  const topRequestMajors = [...stats.expert.categoryCounts]
    .sort((a, b) => {
      const aSum = a.midCategories.reduce((s, m) => s + m.count, 0)
      const bSum = b.midCategories.reduce((s, m) => s + m.count, 0)
      return bSum - aSum
    })
    .slice(0, 4)
    .map((c) => c.majorLabel)

  return (
    <div className="flex flex-1 flex-col">
      {/* 네비게이션 */}
      <nav className="responsive-container flex items-center justify-end gap-3 px-4 md:px-6 py-2">
        <Link href="/ax" className="text-xs text-text-muted hover:text-text transition-colors">AX 전환</Link>
        <Link href="/service" className="text-xs text-text-muted hover:text-text transition-colors">서비스 안내</Link>
        {isAdmin && (
          <Link href="/dashboard" className="text-xs text-accent font-medium hover:text-accent/80 transition-colors">관리자</Link>
        )}
      </nav>

      <SplashOverlay />

      <div className="flex flex-1 flex-col items-center px-4 md:px-6 py-10 md:py-14">
        <main className="responsive-container flex flex-col items-center gap-10 md:gap-14 lg:gap-16">
          {/* 히어로 */}
          <section className="flex flex-col items-center gap-3 text-center animate-fade-in">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-text leading-snug">
              맡기기 전에,
              <br />
              이것만 확인해 보세요.
            </h1>
            <p className="text-base md:text-lg text-text-muted leading-relaxed">
              값·범위·약속·몫·복구 — 다섯 가지를 먼저 볼 수 있습니다.
            </p>
            <p className="text-xs text-text-subtle">
              {stats.owner.totalMajorFields}개 분야 · {stats.owner.totalCategories}개 전문영역 · {stats.owner.totalServices}+ 서비스
            </p>
          </section>

          {/* 공간 선택 카드 */}
          <section className="w-full animate-fade-in stagger-1">
            <div className="flex flex-col gap-4 rounded-2xl bg-surface-warm p-4 md:p-6">
              <a
                href={ownerUrl}
                className="rounded-2xl border-t-4 border-t-primary border border-border-light bg-white p-6 md:p-8 text-left shadow-sm card-hover card-glow transition-all"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-primary">기업공간</h2>
                <p className="mt-2 text-sm md:text-base text-text-muted">일은 사람이 합니다 — 전문가에게 직접 의뢰</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">에스크로 선입금</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">매칭비 사전 공개</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">검수 후 정산</span>
                </div>
                {topExpertMajors.length > 0 && (
                  <p className="mt-3 text-xs text-text-subtle">
                    인기 분야: {topExpertMajors.join(' / ')}
                  </p>
                )}
                <div className="mt-4 text-sm font-semibold text-primary">기업공간 바로가기 &rarr;</div>
              </a>

              <a
                href={expertUrl}
                className="rounded-2xl border-t-4 border-t-accent border border-border-light bg-white p-6 md:p-8 text-left shadow-sm card-hover card-glow transition-all"
              >
                <h2 className="text-2xl md:text-3xl font-bold text-accent">전문가공간</h2>
                <p className="mt-2 text-sm md:text-base text-text-muted">당신의 30년, AI로 증폭하다 — 작업료 전액 수령</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">열린 의뢰 {stats.expert.totalOpenRequests}건</span>
                  <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">수수료 0%</span>
                  <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">보장 결제</span>
                </div>
                {topRequestMajors.length > 0 && (
                  <p className="mt-3 text-xs text-text-subtle">
                    의뢰 많은 분야: {topRequestMajors.join(' / ')}
                  </p>
                )}
                <div className="mt-4 text-sm font-semibold text-accent">전문가공간 바로가기 &rarr;</div>
              </a>
            </div>
          </section>

          {/* 먼저 꺼내놓는 다섯 가지 */}
          <section className="w-full animate-fade-in stagger-2">
            <div className="rounded-2xl bg-white p-5 md:p-8 shadow-sm">
              <h2 className="text-xl md:text-2xl font-bold font-serif text-text mb-4">먼저 꺼내놓는 다섯 가지</h2>
              <div className="flex flex-col gap-3">
                {([
                  { num: '1', item: '값', desc: '수수료율을 계약 전에 확인합니다', href: '' },
                  { num: '2', item: '범위', desc: '업무 범위, 착수 전에 못 박습니다', href: '/standard/scope' },
                  { num: '3', item: '약속', desc: '대금, 에스크로에 먼저 보관합니다', href: '' },
                  { num: '4', item: '몫', desc: '분배 구조, 숨기지 않습니다', href: '' },
                  { num: '5', item: '복구', desc: '문제 시, 적립금으로 먼저 보전합니다', href: '/standard/guarantee' },
                ]).map((row) => {
                  const card = (
                    <div className={`flex items-center gap-4 rounded-xl border border-border-light p-4 md:p-5${row.href ? ' transition-colors hover:border-primary/30 hover:shadow-xs' : ''}`}>
                      <span className="text-xl md:text-2xl font-bold text-primary shrink-0 w-7 text-center">{row.num}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm md:text-base font-semibold text-text">{row.item}</p>
                        <p className="mt-0.5 text-xs md:text-sm text-text-muted">{row.desc}</p>
                      </div>
                      {row.href && (
                        <span className="text-sm font-medium text-primary shrink-0">&rarr;</span>
                      )}
                    </div>
                  )
                  return row.href ? (
                    <Link key={row.item} href={row.href}>{card}</Link>
                  ) : (
                    <div key={row.item}>{card}</div>
                  )
                })}
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-border-light bg-surface py-6">
        <div className="responsive-container flex flex-col gap-4 px-4 md:px-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <OwlIcon className="h-6 w-6 text-primary" />
              <div>
                <p className="text-sm font-semibold text-brand-gradient">지사네</p>
                <p className="text-xs text-text-subtle">일은 사람이 합니다</p>
              </div>
            </div>
            <p className="text-xs text-text-subtle">운영: (주)지사네</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
            <span>사업자등록번호: 405-02-46113</span>
            <span>이메일: iamblackwhite86@gmail.com</span>
          </div>
          <div className="flex gap-3 text-xs">
            <Link href="/privacy" className="text-text-subtle hover:text-text-muted transition-colors">개인정보처리방침</Link>
            <Link href="/service" className="text-text-subtle hover:text-text-muted transition-colors">서비스 안내</Link>
            <Link href="/standard/scope" className="text-text-subtle hover:text-text-muted transition-colors">거래 표준</Link>
            <Link href="/ax" className="text-text-subtle hover:text-text-muted transition-colors">AX 전환</Link>
          </div>
          <hr className="border-border-light" />
          <p className="text-xs text-text-subtle">&copy; 2026 (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
