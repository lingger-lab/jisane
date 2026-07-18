import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { fetchOwnerLandingStats } from '@jisane/shared/landing-stats'
import { getPackagesByAudience } from '@jisane/shared/service-catalog'
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { AnimatedCounter } from '@jisane/ui/animated-counter'
import { OwlIcon } from '@jisane/ui/icons/owl'

export default async function OwnerHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/status')
  }

  const stats = await fetchOwnerLandingStats()
  const services = getPackagesByAudience('owner')
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'
  const expertUrl = process.env.NEXT_PUBLIC_EXPERT_URL || 'https://expert.jisane.cloud'

  // 핵심 수치 (만족도 없으면 3칸)
  const metrics: { end: number; suffix: string; label: string }[] = [
    { end: stats.totalMajorFields, suffix: '', label: '전문 분야' },
    { end: stats.totalCategories, suffix: '', label: '전문영역' },
    { end: stats.totalServices, suffix: '+', label: '서비스 항목' },
  ]
  if (stats.avgSatisfaction !== null) {
    metrics.push({ end: stats.avgSatisfaction, suffix: '', label: '만족도' })
  }

  return (
    <div className="flex flex-1 flex-col items-center animate-slide-up">
      {/* [1] 히어로 */}
      <section className="responsive-container flex flex-col items-center gap-4 px-4 md:px-6 pt-12 md:pt-16 pb-8 md:pb-10 text-center">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-text leading-snug">
          일을 맡겼는데,
          <br />
          끝나고 보니 생각한 것과 달랐던 적 있으셨나요?
        </h1>
        <p className="text-base md:text-lg text-text-muted">조건을 먼저 볼 수 있는 곳에 맡깁니다 — 에스크로 직거래</p>

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

      {/* [2] 핵심 수치 — 풀블리드 배경 */}
      <div className="w-full bg-surface-warm py-8 md:py-12">
        <section className="responsive-container px-4 md:px-6">
          <div className={`grid gap-3 md:gap-4 ${metrics.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
            {metrics.map((m) => (
              <div key={m.label} className="flex flex-col items-center rounded-xl bg-white p-5 md:p-6 shadow-xs">
                <AnimatedCounter end={m.end} suffix={m.suffix} className="text-3xl md:text-4xl font-bold text-primary" />
                <span className="mt-1 text-sm text-text-muted">{m.label}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* [2.5] 이런 경험, 있으셨나요? — 고통 언어화 */}
      <section className="responsive-container px-4 md:px-6 py-8 md:py-12">
        <div className="rounded-xl border-t-4 border-t-warning bg-surface-warm p-5 md:p-6">
          <p className="text-base font-bold text-text">이런 경험, 있으셨나요?</p>
          <ul className="mt-3 flex flex-col gap-3 text-sm md:text-base text-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">&mdash;</span>
              일을 맡겼는데 끝나고 보니 생각한 것과 달랐다 — &ldquo;이것도 해주는 줄 알았는데&rdquo;
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">&mdash;</span>
              수수료가 얼마인지, 누가 얼마를 떼는지 끝까지 알 수 없었다
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-text-subtle">&mdash;</span>
              대금을 먼저 보냈는데 일이 흐지부지됐고, 하소연할 곳도 없었다
            </li>
          </ul>
          <p className="mt-4 text-xs md:text-sm text-text-subtle">
            이건 사람을 잘못 본 게 아니라, 조건을 미리 볼 수 없는 구조 때문에 생긴 오해입니다.
          </p>
        </div>
      </section>

      {/* [3] 카테고리 탐색 */}
      <section className="responsive-container px-4 md:px-6 py-8 md:py-12">
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

      {/* [3.5] 비교해보세요 — 풀블리드 배경 */}
      <div className="w-full bg-white py-8 md:py-12">
        <section className="responsive-container px-4 md:px-6">
          <h2 className="text-xl md:text-2xl font-bold text-text">비교해보세요</h2>
          <div className="mt-4 flex flex-col gap-4">
            {[
              { old: '수수료를 나중에 알려준다', jisane: '매칭비 7구간 단가를 사전 공개' },
              { old: '보낸 돈이 바로 전달된다', jisane: '에스크로에 보관 → 검수 완료 후 정산' },
              { old: '문제가 생기면 연락이 안 된다', jisane: '책임적립금으로 복구 재원을 미리 확보' },
            ].map((row) => (
              <div key={row.old} className="grid grid-cols-2 gap-4">
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

      {/* [4] 전문 서비스 */}
      <section className="responsive-container px-4 md:px-6 py-8 md:py-12">
        <h2 className="text-xl md:text-2xl font-bold text-text">{stats.totalServices}+ 전문 서비스를 둘러보세요</h2>
        <div className="mt-4 flex flex-col gap-4">
          {services.map((pkg) => (
            <div
              key={pkg.slug}
              className="rounded-xl border border-border-light border-l-4 border-l-primary p-4 md:p-5 lg:p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text">{pkg.name}</h3>
                    {pkg.isFree && (
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                        무료
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-muted leading-relaxed">
                    {pkg.valueDesc}
                  </p>
                </div>
                {pkg.duration && (
                  <span className="shrink-0 text-xs text-text-subtle">{pkg.duration}</span>
                )}
              </div>
              <div className="mt-3 flex justify-end">
                {pkg.isFree ? (
                  <Link
                    href={`/services/${pkg.slug}`}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-light"
                  >
                    무료로 시작하기
                  </Link>
                ) : (
                  <Link
                    href={`/services/${pkg.slug}`}
                    className="rounded-lg border border-border-light px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    자세히 보기
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* [5] 신뢰 배지 — 풀블리드 배경 */}
      <div className="w-full bg-primary/5 py-8 md:py-12">
        <section className="responsive-container px-4 md:px-6">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {([
              { title: '가격 사전 공개', desc: '매칭비 7구간 · 숨은 수수료 없음', href: `${adminUrl}/standard/scope` },
              { title: '에스크로 보관', desc: '입금 → 검수 → 정산 · 선정산 없음', href: '' },
              { title: '책임적립금', desc: '매칭비 10% 적립 · 복구 재원 선확보', href: `${adminUrl}/standard/guarantee` },
            ]).map((badge) => {
              const card = (
                <div
                  className={`flex flex-col items-center rounded-xl border border-border-light bg-white p-5 md:p-6 text-center shadow-sm${badge.href ? ' transition-colors hover:border-primary/30' : ''}`}
                >
                  <span className="text-base md:text-lg font-bold text-primary">{badge.title}</span>
                  <span className="mt-1 text-xs md:text-sm text-text-muted">{badge.desc}</span>
                </div>
              )
              return badge.href ? (
                <a key={badge.title} href={badge.href}>{card}</a>
              ) : (
                <div key={badge.title}>{card}</div>
              )
            })}
          </div>
        </section>
      </div>

      {/* [6] CTA 반복 */}
      <section className="responsive-container px-4 md:px-6 py-8 md:py-12">
        <div className="rounded-2xl bg-primary/10 p-6 md:p-8">
          <p className="mb-4 text-center text-base md:text-lg font-semibold text-text leading-relaxed">
            무료 용역 명세서 초안과 예상 수수료부터 보내드립니다
          </p>
          <p className="mb-5 text-center text-sm text-text-muted">마음에 안 들면 덮으셔도 됩니다</p>
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

      {/* [7] 크로스링크 배너 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <a
          href={expertUrl}
          className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-5 md:p-6 transition-colors hover:bg-accent/10"
        >
          <div>
            <p className="text-base font-semibold text-text">전문가이신가요?</p>
            <p className="mt-1 text-sm text-text-muted">당신의 30년, AI로 증폭하다 — 작업료 전액 수령</p>
          </div>
          <span className="text-sm font-medium text-accent shrink-0">&rarr;</span>
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
          <div className="flex flex-wrap gap-3 text-xs text-text-subtle">
            <a href={`${adminUrl}/service`} className="hover:text-text-muted transition-colors">서비스 안내</a>
            <a href={`${adminUrl}/ax`} className="hover:text-text-muted transition-colors">AX 전환</a>
            <a href={expertUrl} className="hover:text-text-muted transition-colors">전문가공간</a>
            <a href={`${adminUrl}/privacy`} className="hover:text-text-muted transition-colors">개인정보처리방침</a>
          </div>
          <p className="text-xs text-text-subtle">&copy; 2026 (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
