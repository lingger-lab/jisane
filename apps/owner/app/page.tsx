import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { signInWithGoogle, signInWithKakao } from '@jisane/shared/auth/actions'
import { GoogleIcon } from '@jisane/ui/icons/google'
import { KakaoIcon } from '@jisane/ui/icons/kakao'
import { fetchOwnerLandingStats } from '@jisane/shared/landing-stats'
import { getPackagesByAudience } from '@jisane/shared/service-catalog'
import { CategoryBrowse } from '@/components/category-browse'

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
  const partnerUrl = process.env.NEXT_PUBLIC_PARTNER_URL || 'https://partner.jisane.cloud'

  // 핵심 수치 (만족도 없으면 3칸)
  const metrics: { value: string | number; label: string }[] = [
    { value: stats.totalMajorFields, label: '전문 분야' },
    { value: stats.totalCategories, label: '전문영역' },
    { value: `${stats.totalServices}+`, label: '서비스 항목' },
  ]
  if (stats.avgSatisfaction !== null) {
    metrics.push({ value: stats.avgSatisfaction, label: '만족도' })
  }

  return (
    <div className="flex flex-1 flex-col items-center animate-slide-up">
      {/* [1] Hero */}
      <section className="flex w-full max-w-md flex-col items-center gap-4 px-4 pt-10 pb-6 text-center">
        <h1 className="text-2xl font-bold text-primary">지사네 기업공간</h1>
        <p className="text-base font-medium text-text leading-relaxed">
          검증된 시니어 전문가에게
          <br />
          일을 맡기세요
        </p>
        <p className="text-sm text-text-muted">부울경 시니어 전문가 네트워크</p>

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

      {/* [2] 핵심 수치 — 전문성의 폭 */}
      <section className="w-full max-w-md px-4 py-6">
        <div className={`grid gap-3 ${metrics.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col items-center rounded-xl bg-surface-warm p-3">
              <span className="text-2xl font-bold text-primary">{m.value}</span>
              <span className="mt-0.5 text-xs text-text-muted">{m.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* [3] 카테고리 탐색 */}
      <section className="w-full max-w-md px-4 py-6">
        <CategoryBrowse
          categoryCounts={stats.categoryCounts}
          newRequestsThisMonth={stats.newRequestsThisMonth}
        />
      </section>

      {/* [4] 검증된 전문 서비스 */}
      <section className="w-full max-w-md px-4 py-6">
        <h2 className="text-lg font-bold text-text">검증된 전문 서비스</h2>
        <div className="mt-3 flex flex-col gap-3">
          {services.map((pkg) => (
            <div
              key={pkg.slug}
              className="rounded-xl border border-border-light p-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-text">{pkg.name}</h3>
                    {pkg.isFree && (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                        무료
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-text-muted leading-relaxed">
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
                    className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-primary-light"
                  >
                    무료로 시작하기
                  </Link>
                ) : (
                  <Link
                    href={`/services/${pkg.slug}`}
                    className="rounded-lg border border-border-light px-4 py-2 text-xs font-medium text-text-muted transition-colors hover:border-primary/30 hover:text-primary"
                  >
                    자세히 보기
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* [5] 신뢰 배지 */}
      <section className="w-full max-w-md px-4 py-6">
        <div className="grid grid-cols-3 gap-2">
          {[
            { title: '수수료 0%', desc: '기업 부담 없음' },
            { title: '에스크로', desc: '안전결제' },
            { title: '검증된', desc: '전문가 매칭' },
          ].map((badge) => (
            <div
              key={badge.title}
              className="flex flex-col items-center rounded-xl border border-border-light bg-white p-3 text-center shadow-xs"
            >
              <span className="text-sm font-bold text-primary">{badge.title}</span>
              <span className="mt-0.5 text-[10px] text-text-muted">{badge.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* [6] CTA 반복 */}
      <section className="w-full max-w-md px-4 py-6">
        <p className="mb-4 text-center text-base font-semibold text-text">
          지금 바로 시작하세요
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
      <section className="w-full max-w-md px-4 py-4">
        <a
          href={partnerUrl}
          className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 p-4 transition-colors hover:bg-accent/10"
        >
          <div>
            <p className="text-sm font-semibold text-text">시니어 전문가이신가요?</p>
            <p className="mt-0.5 text-xs text-text-muted">경험으로 일하고, 정당한 대가를 받으세요</p>
          </div>
          <span className="text-sm font-medium text-accent shrink-0">&rarr;</span>
        </a>
      </section>

      {/* [8] 푸터 */}
      <footer className="w-full max-w-md px-4 py-6">
        <div className="flex justify-center gap-4 text-xs text-text-subtle">
          <a href={`${adminUrl}/service`} className="hover:text-text-muted transition-colors">서비스 안내</a>
          <a href={`${adminUrl}/ax`} className="hover:text-text-muted transition-colors">AX 전환</a>
          <a href={partnerUrl} className="hover:text-text-muted transition-colors">시니어공간</a>
          <a href={`${adminUrl}/privacy`} className="hover:text-text-muted transition-colors">개인정보처리방침</a>
        </div>
      </footer>
    </div>
  )
}
