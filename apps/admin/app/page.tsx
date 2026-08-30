import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { fetchHubLandingStats } from '@jisane/shared/landing-stats'
import { SplashOverlay } from '@/components/splash-overlay'
import { OwlIcon } from '@jisane/ui/icons/owl'
import { HeroBackdrop } from '@jisane/ui/hero-backdrop'
import { TextRotator } from '@jisane/ui/text-rotator'
import { AnimatedCounter } from '@jisane/ui/animated-counter'
import { ArrowRight, Building2, UserRound, Handshake } from 'lucide-react'
import { OWNER_URL, EXPERT_URL } from '@/lib/urls'
import { faqJsonLd } from '@jisane/shared/seo'
import { JsonLd } from '@jisane/ui/json-ld'

// FAQ 단일 소스 — 화면 렌더 + FAQPage JSON-LD(AEO) + llms.txt가 같은 답변을 쓴다.
const FAQS = [
  { q: '지사네는 어떤 서비스인가요?', a: '부울경(부산·울산·경남) 중소기업에 필요한 전문 서비스와 경험·노하우를 갖춘 시니어 전문가 정보를 연결하는 지식나눔 사업협력 네트워크입니다. 온사이트 AI(RAG) 상담도 제공합니다.' },
  { q: '어떤 전문 서비스를 제공하나요?', a: '경영·마케팅 사업화, 재무·세무·회계 컨설팅, 기술·생산 품질관리, 온라인·홍보 판로개척, AI·AX 전환 등 5대 지원 분야의 전문 서비스를 제공합니다.' },
  { q: '이용 절차는 어떻게 되나요?', a: '접수 → 합의 → 결제(에스크로) → 작업 → 정산의 5단계로 진행됩니다. 조건을 먼저 확인하고 맡기는 안전 직거래 방식입니다.' },
  { q: '비용은 어떻게 되나요?', a: '회원 가입은 무료이며, 서비스별 비용은 상담으로 안내합니다(일부는 상담 문의). 시니어 전문가는 작업료 전액을 수령합니다(작업료 수수료 0%).' },
  { q: '상담 문의는 유료인가요?', a: '아닙니다. 지사네의 모든 상담 문의는 무료입니다. 관심 있는 서비스 페이지에서 이름·연락처만 남기면 담당 매니저가 1영업일 내 연락드립니다.' },
  { q: '어느 지역을 대상으로 하나요?', a: '부산·울산·경남(부울경) 지역 중소기업을 주 대상으로 합니다.' },
  { q: '안전 거래는 어떻게 보장하나요?', a: '지사네 거래 표준(값·범위·약속·몫·복구 5원칙)과 에스크로, 책임 적립금 운영으로 문제가 생기면 지사네가 먼저 움직입니다.' },
]

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
    <div className="landing-snap flex flex-1 flex-col">
      {/* 네비게이션 */}
      <nav className="container-app flex items-center justify-end gap-3 px-4 md:px-6 py-2">
        <Link href="/ax" className="text-xs text-text-muted hover:text-text transition-colors">AX 전환</Link>
        <Link href="/service" className="text-xs text-text-muted hover:text-text transition-colors">서비스 안내</Link>
        {isAdmin && (
          <Link href="/dashboard" className="text-xs text-accent font-medium hover:text-accent/80 transition-colors">관리자</Link>
        )}
      </nav>

      <SplashOverlay />

      {/* 히어로 — 브랜드 딥그린 다크 밴드 (렐라랩 벤치마킹: 아이브로우→제목→서브→수치) */}
      <div className="hero-dark w-full snap-section">
        <HeroBackdrop intensity="hero" />
        <section className="hero-parallax-content container-marketing relative z-10 flex flex-col items-center gap-4 px-4 md:px-6 pt-14 md:pt-20 pb-12 md:pb-16 text-center">
          <span className="hero-eyebrow animate-slide-up stagger-1">기업의 곁에, 언제나 당신곁에</span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-white leading-snug animate-slide-up stagger-2">
            지역 기업의 든든한 성장
            <br />
            <TextRotator
              words={['파트너', '동반자', '길잡이']}
              className="text-accent-light"
              buttonClassName="text-white/50 hover:text-white/90"
            />
          </h1>
          <p className="text-base md:text-lg text-white/75 leading-relaxed animate-slide-up stagger-3">
            중소기업 전문 서비스와 시니어 전문가 정보를 한곳에서.
          </p>
          <p className="text-xs text-white/50 animate-slide-up stagger-4">
            <AnimatedCounter end={stats.owner.totalMajorFields} />개 전문 분야 · 전문가{' '}
            <AnimatedCounter end={stats.owner.totalExperts} />명
          </p>
        </section>
      </div>

      <div className="flex flex-1 flex-col items-center px-4 md:px-6 py-10 md:py-14">
        <main className="container-marketing flex flex-col items-center gap-10 md:gap-14 lg:gap-16">
          {/* 공간 선택 카드 */}
          <section className="w-full animate-fade-in stagger-1 snap-section">
            {/* 외곽 패널(bg-surface-warm) 제거 — 패널 테두리+카드 테두리 2중 프레임/회색 화면 원인.
                카드들은 페이지 배경 위에 각자 단일 테두리로. */}
            <div className="reveal-cards flex flex-col gap-4">
              <a
                href={ownerUrl}
                className="rounded-2xl border border-border-light bg-card p-6 md:p-8 text-left group shadow-sm card-hover card-glow transition-all"
              >
                <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Building2 className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" /></span>
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-primary">기업회원</h2>
                <p className="mt-2 text-sm md:text-base text-text-muted">기업 운영에 필요한 전문 서비스와 시니어 전문가 정보</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">전문서비스 정보</span>
                  <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">전문가 정보</span>
                </div>
                {topExpertMajors.length > 0 && (
                  <p className="mt-3 truncate text-xs text-text-subtle">
                    {topExpertMajors.join(' / ')}
                  </p>
                )}
                <div className="mt-4 flex items-center text-sm font-semibold text-primary">기업회원 바로가기<ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></div>
              </a>

              <a
                href={expertUrl}
                className="rounded-2xl border border-border-light bg-card p-6 md:p-8 text-left group shadow-sm card-hover card-glow transition-all"
              >
                <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><UserRound className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" /></span>
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-accent">시니어지식인회원</h2>
                <p className="mt-2 text-sm md:text-base text-text-muted">경험과 노하우로 지역 기업과 협력</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">열린 의뢰 {stats.expert.totalOpenRequests}건</span>
                  <span className="rounded-full bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">전문 도구</span>
                </div>
                {topRequestMajors.length > 0 && (
                  <p className="mt-3 truncate text-xs text-text-subtle">
                    {topRequestMajors.join(' / ')}
                  </p>
                )}
                <div className="mt-4 flex items-center text-sm font-semibold text-accent">시니어지식인회원 바로가기<ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></div>
              </a>

              {/* 전문가회원 — 특수관계 제공기관용 (기업·시니어와 동일 구조) */}
              <Link
                href="/partner"
                className="rounded-2xl border border-border-light bg-card p-6 md:p-8 text-left group shadow-sm card-hover card-glow transition-all"
              >
                <span className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-partner/10 text-partner"><Handshake className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" /></span>
                <h2 className="text-2xl md:text-3xl font-bold font-serif text-partner">전문가회원</h2>
                <p className="mt-2 text-sm md:text-base text-text-muted">
                  전문서비스를 제공하는 특수관계 회원 — 기업 또는 시니어지식인 — 서비스 등록 · 신청 관리
                </p>
                <div className="mt-4 flex items-center text-sm font-semibold text-partner">전문가회원 바로가기<ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></div>
              </Link>
            </div>
          </section>

          {/* FAQ — 답변형 콘텐츠(AEO). FAQPage JSON-LD와 동일 소스(FAQS). */}
          <section className="container-marketing px-4 md:px-6 pb-12 snap-section">
            <h2 className="mb-5 text-xl md:text-2xl font-bold font-serif text-text">자주 묻는 질문</h2>
            <dl className="reveal-cards flex flex-col gap-3">
              {FAQS.map((f) => (
                <div key={f.q} className="rounded-xl border border-border-light bg-card p-4 shadow-xs">
                  <dt className="text-sm md:text-base font-semibold text-text">{f.q}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-text-muted">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>

        </main>
      </div>
      <JsonLd data={faqJsonLd(FAQS)} />

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
            {!isAdmin && (
              <Link href="/login" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">관리자 로그인</Link>
            )}
          </div>
          <hr className="border-border-light" />
          <p className="text-xs text-text-subtle">&copy; {new Date().getFullYear()} (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
