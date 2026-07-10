import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { fetchPartnerLandingStats } from '@jisane/shared/landing-stats'
import { getPackagesByAudience } from '@jisane/shared/service-catalog'
import { CategoryBrowse } from '@jisane/ui/category-browse'
import { AnimatedCounter } from '@jisane/ui/animated-counter'

export default async function PartnerHome() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: partner } = await adminClient
      .from('partner')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()

    if (partner) {
      redirect('/matching')
    }
    redirect('/register')
  }

  const stats = await fetchPartnerLandingStats()
  const education = getPackagesByAudience('partner')
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || 'https://jisane.cloud'
  const ownerUrl = process.env.NEXT_PUBLIC_OWNER_URL || 'https://owner.jisane.cloud'

  // 핵심 수치 (완료거래 0이면 3칸)
  const metrics: { end: number; suffix: string; label: string }[] = [
    { end: stats.totalClients, suffix: '+', label: '참여 기업' },
    { end: stats.totalOpenRequests, suffix: '건', label: '열린 의뢰' },
    { end: 0, suffix: '%', label: '수수료' },
  ]
  if (stats.totalCompletedDeals > 0) {
    metrics.push({ end: stats.totalCompletedDeals, suffix: '건', label: '완료 거래' })
  }

  return (
    <div className="flex flex-1 flex-col items-center animate-slide-up">
      {/* [1] Hero */}
      <section className="responsive-container flex flex-col items-center gap-4 px-4 md:px-6 pt-10 pb-6 text-center">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold font-serif text-text leading-relaxed">
          재주를 부리고,
          <br />
          몫은 다른 사람이 가져갔습니다.
        </h1>
        <p className="text-sm text-text-muted">작업료 전액, 당신 통장으로</p>

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
      </section>

      {/* [2] 핵심 수치 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <div className={`grid gap-3 md:gap-4 ${metrics.length === 4 ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-3'}`}>
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center rounded-xl bg-surface-warm p-4 md:p-5">
              <AnimatedCounter end={m.end} suffix={m.suffix} className="text-2xl font-bold text-accent" />
              <span className="mt-0.5 text-xs text-text-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* [2.5] 이런 경험, 있으셨나요? — 고통 언어화 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <div className="rounded-xl bg-surface-warm p-5">
          <p className="text-sm font-semibold text-text">이런 경험, 있으셨나요?</p>
          <ul className="mt-3 flex flex-col gap-2 text-sm text-text-muted">
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
        </div>
      </section>

      {/* [3] 카테고리별 의뢰 현황 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
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

      {/* [3.5] 비교해보세요 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <h2 className="text-lg md:text-xl font-bold text-text">비교해보세요</h2>
        <div className="mt-3 flex flex-col gap-3">
          {[
            { old: '수수료 20~30%를 떼고 정산한다', jisane: '수수료 0% — 작업료 전액을 당신 통장으로' },
            { old: '작업 완료 후에도 입금이 불확실하다', jisane: '에스크로 선입금 — 기업이 먼저 입금해야 작업 시작' },
            { old: '매칭 기준이 불명확하다', jisane: '매칭 점수 6항목을 투명하게 공개' },
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

      {/* [4] 전문가 역량 강화 프로그램 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <h2 className="text-lg md:text-xl font-bold text-text">당신의 30년, AI로 증폭하다</h2>
        <p className="mt-1 text-sm text-text-muted">경험 × AI = 증폭 — 역량 강화 프로그램</p>
        <div className="mt-3 flex flex-col gap-3">
          {education.map((pkg) => (
            <div
              key={pkg.slug}
              className="rounded-xl border border-border-light p-4 md:p-5 lg:p-6 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-text">{pkg.name}</h3>
                  <p className="mt-1 text-xs text-text-muted leading-relaxed">
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
      </section>

      {/* [5] 신뢰 배지 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          {([
            { title: '수수료 0%', desc: '작업료 전액 · 당신 통장으로 직접 정산', href: '' },
            { title: '에스크로 선입금', desc: '기업이 먼저 입금 · 작업 전 대금 확보', href: `${adminUrl}/standard/guarantee` },
            { title: '매칭 점수 공개', desc: '카테고리·경력·실적 6항목 점수 투명 공개', href: '' },
          ]).map((badge) => {
            const card = (
              <div
                className={`flex flex-col items-center rounded-xl border border-border-light bg-white p-4 md:p-5 text-center shadow-xs${badge.href ? ' transition-colors hover:border-accent/30' : ''}`}
              >
                <span className="text-sm font-bold text-accent">{badge.title}</span>
                <span className="mt-0.5 text-xs text-text-muted">{badge.desc}</span>
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

      {/* [6] CTA 반복 */}
      <section className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <p className="mb-4 text-center text-sm font-semibold text-text leading-relaxed">
          등록 후 열린 의뢰 {stats.totalOpenRequests}건을 확인하세요
        </p>
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
      </section>

      {/* [7] 크로스링크 배너 */}
      <section className="responsive-container px-4 md:px-6 py-4">
        <a
          href={ownerUrl}
          className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 md:p-5 transition-colors hover:bg-primary/10"
        >
          <div>
            <p className="text-sm font-semibold text-text">기업을 운영하고 계신가요?</p>
            <p className="mt-0.5 text-xs text-text-muted">매칭비 사전 공개 · 에스크로 직거래 · 수수료 구조 투명</p>
          </div>
          <span className="text-sm font-medium text-primary shrink-0">&rarr;</span>
        </a>
      </section>

      {/* [8] 푸터 */}
      <footer className="responsive-container px-4 md:px-6 py-6">
        <div className="flex justify-center gap-4 text-xs text-text-subtle">
          <a href={`${adminUrl}/service`} className="hover:text-text-muted transition-colors">서비스 안내</a>
          <a href={ownerUrl} className="hover:text-text-muted transition-colors">기업공간</a>
          <a href={`${adminUrl}/privacy`} className="hover:text-text-muted transition-colors">개인정보처리방침</a>
        </div>
      </footer>
    </div>
  )
}
