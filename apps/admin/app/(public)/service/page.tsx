import Link from 'next/link'
import { PageHero } from '@jisane/ui/page-hero'
import { OWNER_URL, EXPERT_URL } from '@/lib/urls'

export const metadata = {
  title: '서비스 안내 | 지사네',
}

const STEPS = [
  { num: '01', title: '접수', desc: '기업이 필요한 전문 서비스를 등록합니다.' },
  { num: '02', title: '합의', desc: '당사자가 메시지로 작업 범위와 조건을 서로 합의합니다.' },
  { num: '03', title: '결제', desc: '지사네 매니저가 결제와 예치를 진행합니다.' },
  { num: '04', title: '작업', desc: '5단계 워크플로우로 체계적으로 작업을 진행합니다.' },
  { num: '05', title: '정산', desc: '검수 완료 후 전문가에게 작업료 전액이 지급됩니다.' },
] as const

export default function ServicePage() {
  const ownerUrl = OWNER_URL
  const expertUrl = EXPERT_URL

  return (
    <div className="flex flex-1 flex-col">
      <PageHero
        eyebrow="지사네 서비스"
        title="지사네 서비스 안내"
        subtitle="부울경 중소기업에 필요한 전문 서비스와 경험·노하우를 갖춘 시니어 전문가 정보를 제공합니다. 지식나눔 사업협력 네트워크로 지역 기업의 성장을 함께합니다."
        size="lg"
      />
      <div className="responsive-container px-4 md:px-6 py-6">
      {/* 서비스 소개 */}
      <section className="mb-12 animate-fade-in stagger-1">
        <h2 className="mb-4 text-lg font-bold text-text">지사네가 하는 일</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-light bg-surface-warm p-5 shadow-sm">
            <p className="text-sm font-semibold text-primary">기업 운영 전문 서비스 제공</p>
            <p className="mt-2 text-sm text-text-muted">
              경영·마케팅, 재무·세무·회계, 기술·생산, 온라인·홍보, AI·AX 등 기업 성장에 필요한 전문 서비스를 제공합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-border-light bg-surface-warm p-5 shadow-sm">
            <p className="text-sm font-semibold text-accent">시니어 전문가 정보 제공</p>
            <p className="mt-2 text-sm text-text-muted">
              경험과 노하우를 갖춘 분야별 시니어 전문가 정보를 제공하고, 기업과 연결합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 진행 절차 */}
      <section className="mb-12 animate-fade-in stagger-2">
        <h2 className="mb-4 text-lg font-bold text-text">진행 절차</h2>
        <div className="flex flex-col gap-3">
          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`flex gap-4 rounded-xl border border-border-light bg-white p-4 shadow-xs animate-fade-in stagger-${Math.min(i + 1, 5)}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {step.num}
              </span>
              <div>
                <p className="font-semibold text-text">{step.title}</p>
                <p className="mt-0.5 text-sm text-text-muted">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 기업회원 */}
      <section className="mb-8 animate-fade-in stagger-3">
        <div className="rounded-2xl border border-primary/20 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary">기업회원</h2>
          <p className="mt-2 text-sm text-text-muted">
            기업 운영에 필요한 전문 서비스를 신청하고, 시니어 전문가 정보를 확인하세요.
            접수하면 지사네 매니저가 합의부터 정산까지 진행을 도와드립니다.
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              전문 서비스 신청 — 필요한 서비스를 자유롭게 등록
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              시니어 전문가 정보 열람 — 분야별 전문가 확인
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              지사네 매니저 지원 — 합의·결제·정산까지 안전하게
            </li>
          </ul>
          <a
            href={ownerUrl}
            className="mt-5 flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
          >
            기업회원 시작하기
          </a>
        </div>
      </section>

      {/* 시니어지식인회원 */}
      <section className="mb-12 animate-fade-in stagger-4">
        <div className="rounded-2xl border border-accent/20 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-accent">시니어지식인회원</h2>
          <p className="mt-2 text-sm text-text-muted">
            경험과 노하우를 살려 기업과 협력하세요.
            등록하면 기업 의뢰 정보와 작업에 필요한 전문 도구를 이용하실 수 있습니다.
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              전문 분야 등록 — 경력과 노하우를 등록
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              기업 의뢰 정보 확인 — 협력 기회 열람
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              작업 전문 도구 제공 — S/W·교육 지원
            </li>
          </ul>
          <a
            href={expertUrl}
            className="mt-5 flex h-12 items-center justify-center rounded-xl border-2 border-accent text-base font-semibold text-accent transition-colors hover:bg-accent/5 btn-press"
          >
            시니어 전문가 등록하기
          </a>
        </div>
      </section>

      {/* 신뢰 근거 */}
      <section className="rounded-xl border border-border-light bg-surface-warm p-5 animate-fade-in stagger-5">
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-text-subtle uppercase">지사네가 약속합니다</h3>
        <ul className="flex flex-col gap-2 text-sm text-text-muted">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            전문가 정보를 투명하게 제공합니다
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            지사네 매니저가 합의·결제·정산을 안전하게 진행합니다
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            검수 완료 후 작업료 전액을 지급합니다
          </li>
        </ul>
      </section>

      {/* AX 전환 프로모션 */}
      <section className="mt-8 animate-fade-in stagger-5">
        <Link
          href="/ax"
          className="block rounded-2xl border border-accent/20 bg-white p-6 shadow-sm transition-all hover:border-accent/40 hover:shadow-md"
        >
          <p className="text-xs font-semibold text-accent tracking-wide mb-1">AI Transformation</p>
          <p className="font-bold text-text">AI로 비즈니스를 바꾸고 싶으신가요?</p>
          <p className="mt-1 text-sm text-text-muted">
            AX 전환으로 비용 절감·수익 향상·새 수익 모델을 만들어 보세요.
          </p>
          <span className="mt-3 inline-block text-sm font-semibold text-accent">
            AX 전환 알아보기 &rarr;
          </span>
        </Link>
      </section>
      </div>
    </div>
  )
}
