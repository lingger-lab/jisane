import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { fetchHubLandingStats } from '@jisane/shared/landing-stats'
import { getPackagesByAudience } from '@jisane/shared/service-catalog'
import { SplashOverlay } from '@/components/splash-overlay'
import { AnimatedCounter } from '@jisane/ui/animated-counter'

export default async function AdminHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  const isAdmin = user && (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes((user.email || '').toLowerCase())

  const partnerUrl = process.env.NEXT_PUBLIC_PARTNER_URL || 'https://partner.jisane.cloud'
  const ownerUrl = process.env.NEXT_PUBLIC_OWNER_URL || 'https://owner.jisane.cloud'

  const stats = await fetchHubLandingStats()
  const ownerServices = getPackagesByAudience('owner')

  // 핵심 수치
  const metrics = [
    { end: stats.owner.totalMajorFields, suffix: '', label: '전문 분야' },
    { end: stats.owner.totalCategories, suffix: '', label: '전문영역' },
    { end: stats.owner.totalServices, suffix: '+', label: '서비스 항목' },
    { end: stats.partner.totalOpenRequests, suffix: '건', label: '열린 의뢰' },
  ]

  // 인기 분야 (시니어 수 기준 상위 4개 대분류)
  const topPartnerMajors = [...stats.owner.categoryCounts]
    .sort((a, b) => {
      const aSum = a.midCategories.reduce((s, m) => s + m.count, 0)
      const bSum = b.midCategories.reduce((s, m) => s + m.count, 0)
      return bSum - aSum
    })
    .slice(0, 4)
    .map((c) => c.majorLabel)

  // 의뢰 많은 분야 (의뢰 수 기준 상위 4개 대분류)
  const topRequestMajors = [...stats.partner.categoryCounts]
    .sort((a, b) => {
      const aSum = a.midCategories.reduce((s, m) => s + m.count, 0)
      const bSum = b.midCategories.reduce((s, m) => s + m.count, 0)
      return bSum - aSum
    })
    .slice(0, 4)
    .map((c) => c.majorLabel)

  return (
    <div className="flex flex-1 flex-col">
      {/* [1] Hero + 네비게이션 */}
      <nav className="responsive-container flex items-center justify-end gap-3 px-4 md:px-6 py-2">
        <Link href="/ax" className="text-xs text-text-muted hover:text-text transition-colors">AX 전환</Link>
        <Link href="/service" className="text-xs text-text-muted hover:text-text transition-colors">서비스 안내</Link>
        {isAdmin && (
          <Link href="/dashboard" className="text-xs text-accent font-medium hover:text-accent/80 transition-colors">관리자</Link>
        )}
      </nav>

      <SplashOverlay />

      <div className="flex flex-1 flex-col items-center px-4 md:px-6 py-8 md:py-10">
        <main className="responsive-container flex flex-col items-center gap-8 md:gap-10 lg:gap-12">
          {/* Hero */}
          <section className="flex flex-col items-center gap-3 text-center animate-fade-in">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold font-serif text-text leading-relaxed">
              맡기기 전에,
              <br />
              이것만 확인해 보세요.
            </h1>
            <p className="text-sm text-text-muted leading-relaxed">
              수수료는 얼마인지, 업무 범위는 어디까지인지,
              <br />
              문제가 생기면 어떻게 되는지
              <br />
              — 다섯 가지를 먼저 볼 수 있습니다.
            </p>
            <p className="text-xs text-text-subtle">
              {stats.owner.totalMajorFields}개 분야 · {stats.owner.totalCategories}개 전문영역 · {stats.owner.totalServices}+ 서비스
            </p>
          </section>

          {/* [2] 핵심 수치 */}
          <section className="w-full animate-fade-in stagger-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {metrics.map((m) => (
                <div key={m.label} className="flex flex-col items-center rounded-xl bg-surface-warm p-4 md:p-5">
                  <AnimatedCounter end={m.end} suffix={m.suffix} className="text-xl font-bold text-primary" />
                  <span className="mt-0.5 text-xs text-text-muted">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* [3] 공간 선택 카드 */}
          <section className="flex w-full flex-col gap-4 animate-fade-in stagger-2">
            <a
              href={ownerUrl}
              className="rounded-2xl border-2 border-primary bg-white p-5 md:p-6 text-left shadow-sm card-hover card-glow transition-all"
            >
              <h2 className="text-xl md:text-2xl font-bold text-primary">기업공간</h2>
              <p className="mt-1 text-sm text-text-muted">당신 이름으로, 당신 통장으로 — 시니어에게 직접 의뢰</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">에스크로 선입금</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">매칭비 사전 공개</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">검수 후 정산</span>
              </div>
              {topPartnerMajors.length > 0 && (
                <p className="mt-3 text-xs text-text-subtle">
                  인기 분야: {topPartnerMajors.join(' / ')}
                </p>
              )}
              <div className="mt-3 text-sm font-semibold text-primary">기업공간 바로가기 &rarr;</div>
            </a>

            <a
              href={partnerUrl}
              className="rounded-2xl border-2 border-accent bg-white p-5 md:p-6 text-left shadow-sm card-hover card-glow transition-all"
            >
              <h2 className="text-xl md:text-2xl font-bold text-accent">시니어공간</h2>
              <p className="mt-1 text-sm text-text-muted">당신의 30년, AI로 증폭하다 — 작업료 전액 수령</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">열린 의뢰 {stats.partner.totalOpenRequests}건</span>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">수수료 0%</span>
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">보장 결제</span>
              </div>
              {topRequestMajors.length > 0 && (
                <p className="mt-3 text-xs text-text-subtle">
                  의뢰 많은 분야: {topRequestMajors.join(' / ')}
                </p>
              )}
              <div className="mt-3 text-sm font-semibold text-accent">시니어공간 바로가기 &rarr;</div>
            </a>
          </section>

          {/* [3.5] 비교 — 감추는 관행 vs 지사네 */}
          <section className="w-full animate-fade-in stagger-3">
            <h2 className="text-lg md:text-xl font-bold font-serif text-text">이렇게까지 미리 밝히는 곳이 또 있는지.</h2>
            <p className="mt-1 text-sm text-text-muted">감추는 관행 vs 먼저 공개하는 구조</p>
            <div className="mt-4 flex flex-col gap-3">
              {[
                { old: '수수료를 작업 후에 알려준다', jisane: '매칭비 7구간 단가표를 사전 공개한다' },
                { old: '전문가 선정 기준이 불명확하다', jisane: '매칭 점수 6항목을 공개한다' },
                { old: '결제하면 돈이 어디 가는지 모른다', jisane: '에스크로에 입금 → 검수 완료 → 시니어에게 전액 정산' },
                { old: '문제 생기면 복구 조건이 없다', jisane: '책임적립금(매칭비 10%)으로 복구 재원을 미리 쌓는다' },
              ].map((row) => (
                <div key={row.old} className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-error-light border border-error/10 p-3">
                    <p className="text-xs font-medium text-error">감추는 관행</p>
                    <p className="mt-1 text-xs text-text-muted">{row.old}</p>
                  </div>
                  <div className="rounded-xl bg-success-light border border-success/10 p-3">
                    <p className="text-xs font-medium text-success">지사네</p>
                    <p className="mt-1 text-xs text-text-muted">{row.jisane}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* [4] 전문 서비스 */}
          <section className="w-full animate-fade-in stagger-3">
            <h2 className="text-lg md:text-xl font-bold text-text">{stats.owner.totalServices}+ 서비스, 값과 범위를 먼저 공개합니다</h2>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {ownerServices.slice(0, 4).map((pkg) => (
                <a
                  key={pkg.slug}
                  href={`${ownerUrl}/services/${pkg.slug}`}
                  className="rounded-xl border border-border-light bg-white p-4 md:p-5 shadow-xs card-hover"
                >
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-medium text-text">{pkg.name}</h3>
                    {pkg.isFree && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        무료
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-muted leading-relaxed line-clamp-2">
                    {pkg.valueDesc}
                  </p>
                  {pkg.duration && (
                    <p className="mt-2 text-xs text-text-subtle">{pkg.duration}</p>
                  )}
                  <p className="mt-1 text-xs font-medium text-primary">
                    {pkg.isFree ? '무료로 시작' : '자세히 보기'} &rarr;
                  </p>
                </a>
              ))}
            </div>
          </section>

          {/* [5] 매칭 프로세스 */}
          <section className="w-full animate-fade-in stagger-4">
            <h2 className="mb-3 text-lg md:text-xl font-bold text-text">간단한 3단계로 시작하세요</h2>
            <div className="flex flex-col md:flex-row gap-3 md:gap-4">
              {[
                { step: '01', title: '필요한 일을 남깁니다', desc: '의뢰 내용을 자유롭게 등록' },
                { step: '02', title: '다섯 가지를 확정합니다', desc: '값·범위·약속·몫·복구를 사전 합의' },
                { step: '03', title: '안전하게 마무리합니다', desc: '에스크로 검수 완료 후 전액 정산' },
              ].map((s, i) => (
                <div
                  key={s.step}
                  className={`flex flex-1 flex-col items-center rounded-xl border border-border-light bg-white p-4 md:p-5 text-center shadow-xs process-step animate-fade-in`}
                  style={{ animationDelay: `${0.2 + i * 0.1}s` }}
                >
                  <span className="text-lg font-bold text-primary">{s.step}</span>
                  <span className="mt-1 text-xs font-medium text-text">{s.title}</span>
                  <span className="mt-0.5 text-xs text-text-muted">{s.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* [6] 먼저 꺼내놓는 다섯 가지 */}
          <section className="w-full">
            <h2 className="text-lg md:text-xl font-bold font-serif text-text mb-3">먼저 꺼내놓는 다섯 가지</h2>
            <div className="flex flex-col gap-2">
              {([
                { num: '1', item: '값', desc: '수수료율, 먼저 공개합니다', href: '' },
                { num: '2', item: '범위', desc: '업무 범위, 착수 전에 못 박습니다', href: '/standard/scope' },
                { num: '3', item: '약속', desc: '대금, 에스크로에 먼저 보관합니다', href: '' },
                { num: '4', item: '몫', desc: '분배 구조, 숨기지 않습니다', href: '' },
                { num: '5', item: '복구', desc: '문제 시, 적립금으로 먼저 보전합니다', href: '/standard/guarantee' },
              ]).map((row) => {
                const card = (
                  <div className={`flex items-center gap-4 rounded-xl border border-border-light bg-white p-4 shadow-xs${row.href ? ' transition-colors hover:border-primary/30' : ''}`}>
                    <span className="text-lg font-bold text-primary shrink-0 w-6 text-center">{row.num}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text">{row.item}</p>
                      <p className="mt-0.5 text-xs text-text-muted">{row.desc}</p>
                    </div>
                    {row.href && (
                      <span className="text-xs font-medium text-primary shrink-0">&rarr;</span>
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
          </section>

          {/* [7] CTA + 로그인 */}
          {!user && (
            <section className="w-full animate-fade-in">
              <p className="mb-4 text-center text-sm font-semibold text-text leading-relaxed">
                무료 용역 명세서 초안과 예상 수수료부터 보내드립니다
                <br />
                <span className="text-text-muted font-normal">마음에 안 들면 덮으셔도 됩니다 — 위험은 지사네가 집니다</span>
              </p>
              <div className="flex w-full flex-col gap-3">
                <form action={signInWithKakao}>
                  <button
                    type="submit"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-sm font-semibold text-[#191919] shadow-sm transition-all hover:bg-[#FDD800] hover:shadow-md btn-press"
                  >
                    <KakaoIcon className="h-4 w-4" />
                    카카오로 시작하기
                  </button>
                </form>
                <form action={signInWithGoogle}>
                  <button
                    type="submit"
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-sm font-medium text-[#1f1f1f] shadow-sm transition-all hover:bg-surface hover:shadow-md btn-press"
                  >
                    <GoogleIcon className="h-4 w-4" />
                    Google로 시작하기
                  </button>
                </form>
              </div>
            </section>
          )}
        </main>
      </div>

      {/* [8] 푸터 */}
      <footer className="border-t border-border-light bg-surface py-6">
        <div className="responsive-container flex flex-col gap-4 px-4 md:px-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold"><span className="text-brand-gradient">지사네</span> <span className="font-normal text-text-muted">(jisane)</span></p>
              <p className="mt-1 text-xs text-text-subtle">만든 사람이 갖는다</p>
              <p className="text-xs text-text-subtle">값도, 범위도, 먼저 공개합니다</p>
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
