import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { fetchHubLandingStats } from '@jisane/shared/landing-stats'
import { getPackagesByAudience } from '@jisane/shared/service-catalog'
import { SplashOverlay } from '@/components/splash-overlay'

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
    { value: stats.owner.totalMajorFields, label: '전문 분야' },
    { value: stats.owner.totalCategories, label: '전문영역' },
    { value: `${stats.owner.totalServices}+`, label: '서비스 항목' },
    { value: `${stats.partner.totalOpenRequests}건`, label: '열린 의뢰' },
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
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-text leading-relaxed">
              부울경 검증된 시니어 전문가를
              <br />
              지역 기업과 직접 연결합니다
            </h1>
            <p className="text-sm text-text-subtle">
              {stats.owner.totalMajorFields}개 분야 · {stats.owner.totalCategories}개 전문영역 · {stats.owner.totalServices}+ 서비스
            </p>
          </section>

          {/* [2] 핵심 수치 */}
          <section className="w-full animate-fade-in stagger-1">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {metrics.map((m) => (
                <div key={m.label} className="flex flex-col items-center rounded-xl bg-surface-warm p-4 md:p-5">
                  <span className="text-xl font-bold text-primary">{m.value}</span>
                  <span className="mt-0.5 text-xs text-text-muted">{m.label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* [3] 공간 선택 카드 */}
          <section className="flex w-full flex-col gap-4 animate-fade-in stagger-2">
            <a
              href={ownerUrl}
              className="rounded-2xl border-2 border-primary bg-white p-5 md:p-6 text-left shadow-sm card-hover"
            >
              <h2 className="text-xl md:text-2xl font-bold text-primary">기업공간</h2>
              <p className="mt-1 text-sm text-text-muted">검증된 시니어 전문가에게 일을 맡기세요</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">전문가 매칭</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">에스크로</span>
                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">수수료 0%</span>
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
              className="rounded-2xl border-2 border-accent bg-white p-5 md:p-6 text-left shadow-sm card-hover"
            >
              <h2 className="text-xl md:text-2xl font-bold text-accent">시니어공간</h2>
              <p className="mt-1 text-sm text-text-muted">경험으로 일하고, 정당한 대가를 받으세요</p>
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

          {/* [4] 검증된 전문 서비스 */}
          <section className="w-full animate-fade-in stagger-3">
            <h2 className="text-lg md:text-xl font-bold text-text">검증된 전문 서비스</h2>
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
                { step: '01', title: '의뢰 등록', desc: '필요한 작업을 등록' },
                { step: '02', title: '전문가 매칭', desc: 'AI 기반 최적 매칭' },
                { step: '03', title: '에스크로 정산', desc: '검수 후 안전 정산' },
              ].map((s) => (
                <div
                  key={s.step}
                  className="flex flex-1 flex-col items-center rounded-xl border border-border-light bg-white p-4 md:p-5 text-center shadow-xs"
                >
                  <span className="text-lg font-bold text-primary">{s.step}</span>
                  <span className="mt-1 text-xs font-medium text-text">{s.title}</span>
                  <span className="mt-0.5 text-xs text-text-muted">{s.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* [6] 신뢰 배지 */}
          <section className="w-full animate-fade-in stagger-5">
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {[
                { title: '전문가 검증', desc: '네트워크 직접 검증' },
                { title: '에스크로', desc: '안전결제' },
                { title: '수수료 0%', desc: '기업·시니어 모두' },
              ].map((badge) => (
                <div
                  key={badge.title}
                  className="flex flex-col items-center rounded-xl border border-border-light bg-white p-4 md:p-5 text-center shadow-xs"
                >
                  <span className="text-sm font-bold text-primary">{badge.title}</span>
                  <span className="mt-0.5 text-xs text-text-muted">{badge.desc}</span>
                </div>
              ))}
            </div>
          </section>

          {/* [7] CTA + 로그인 */}
          {!user && (
            <section className="w-full animate-fade-in">
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
              <p className="text-sm font-semibold text-text">지사네 <span className="font-normal text-text-muted">(jisane)</span></p>
              <p className="mt-1 text-xs text-text-subtle">부울경 로컬 인력매칭 플랫폼</p>
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
            <Link href="/ax" className="text-text-subtle hover:text-text-muted transition-colors">AX 전환</Link>
          </div>
          <hr className="border-border-light" />
          <p className="text-xs text-text-subtle">&copy; 2025 (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
