import Link from 'next/link'

export const metadata = {
  title: 'AX 전환 | 지사네',
  description: 'AI Transformation — AI로 비즈니스를 바꾸는 AX 전환 서비스',
}

const VALUES = [
  { title: '비용 절감', desc: '반복 업무를 AI가 대체하여 인건비·운영비를 줄입니다.' },
  { title: '수익 향상', desc: 'AI 기반 데이터 분석으로 매출 기회를 포착합니다.' },
  { title: '리스크 감소', desc: '자동 모니터링으로 위험을 사전에 탐지합니다.' },
  { title: '새 수익 모델', desc: 'AI를 활용한 신규 서비스·상품을 만듭니다.' },
  { title: '고객 만족', desc: '24시간 응대·맞춤 추천으로 고객 경험을 높입니다.' },
] as const

const AXES = [
  { num: '01', title: '업무 자동화', desc: '반복적인 문서 작성, 데이터 입력, 보고서 생성을 AI가 처리합니다.' },
  { num: '02', title: '데이터 기반 의사결정', desc: '매출·고객·운영 데이터를 AI가 분석하여 경영 판단을 돕습니다.' },
  { num: '03', title: '위험 관리', desc: '이상 거래 탐지, 품질 모니터링, 규정 준수를 자동화합니다.' },
  { num: '04', title: '마케팅 자동화', desc: '고객 세분화, 콘텐츠 생성, 캠페인 최적화를 AI로 수행합니다.' },
  { num: '05', title: '고객 응대 자동화', desc: 'AI 챗봇·음성봇으로 24시간 고객 문의에 대응합니다.' },
] as const

const LADDER = [
  {
    level: 'Level 1',
    title: 'AI 챗봇',
    desc: '고객 문의 응대, FAQ 자동 답변, 내부 직원 질의응답 등 대화형 AI를 도입합니다.',
    border: 'border-accent/30',
  },
  {
    level: 'Level 2',
    title: '업무 자동화',
    desc: '문서 생성, 데이터 정리, 보고서 작성 등 반복 업무를 AI 워크플로우로 전환합니다.',
    border: 'border-accent/60',
  },
  {
    level: 'Level 3',
    title: 'AI Agent',
    desc: '스스로 판단하고 실행하는 자율 에이전트. 복잡한 의사결정과 작업을 AI가 수행합니다.',
    border: 'border-accent',
  },
] as const

export default function AXPage() {
  const ownerUrl = process.env.NEXT_PUBLIC_OWNER_URL || 'https://owner.jisane.cloud'

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="mb-8 inline-block text-sm text-text-muted hover:text-text transition-colors">
        &larr; 홈으로
      </Link>

      {/* 히어로 */}
      <section className="mb-12 animate-fade-in">
        <p className="mb-2 text-sm font-semibold text-accent tracking-wide">AI Transformation</p>
        <h1 className="text-3xl font-bold text-primary leading-tight">
          AX 전환: AI로 비즈니스를 바꾸다
        </h1>
        <p className="mt-4 text-base text-text-muted leading-relaxed">
          AX(AI Transformation)는 기존 업무 프로세스에 AI를 적용하여 비용을 절감하고, 수익을 높이며,
          새로운 비즈니스 모델을 만드는 전환 과정입니다.
          <br className="hidden sm:block" />
          지사네는 중소기업이 작게 시작해 단계적으로 AI 전환을 이룰 수 있도록 동행합니다.
        </p>
      </section>

      {/* AX 5가지 가치 */}
      <section className="mb-12 animate-fade-in stagger-1">
        <h2 className="mb-4 text-lg font-bold text-text">AX 5가지 가치</h2>
        <p className="mb-5 text-sm text-text-muted">AI 전환을 통해 기업이 얻는 핵심 가치입니다.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {VALUES.map((v, i) => (
            <div
              key={v.title}
              className={`rounded-2xl border border-border-light bg-surface-warm p-5 shadow-sm animate-fade-in stagger-${Math.min(i + 1, 5)}`}
            >
              <p className="text-sm font-semibold text-accent">{v.title}</p>
              <p className="mt-1.5 text-sm text-text-muted">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AX 5대 적용축 */}
      <section className="mb-12 animate-fade-in stagger-2">
        <h2 className="mb-4 text-lg font-bold text-text">AX 5대 적용축</h2>
        <p className="mb-5 text-sm text-text-muted">AI를 적용할 수 있는 5가지 핵심 영역입니다.</p>
        <div className="flex flex-col gap-3">
          {AXES.map((axis, i) => (
            <div
              key={axis.num}
              className={`flex gap-4 rounded-xl border border-border-light bg-white p-4 shadow-xs animate-fade-in stagger-${Math.min(i + 1, 5)}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {axis.num}
              </span>
              <div>
                <p className="font-semibold text-text">{axis.title}</p>
                <p className="mt-0.5 text-sm text-text-muted">{axis.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 구현의 사다리 */}
      <section className="mb-12 animate-fade-in stagger-3">
        <h2 className="mb-4 text-lg font-bold text-text">구현의 사다리</h2>
        <p className="mb-5 text-sm text-text-muted">
          작게 시작해 단계적으로 확장합니다. 각 단계에서 효과를 측정하고 다음 단계로 나아갑니다.
        </p>
        <div className="flex flex-col gap-4">
          {LADDER.map((step) => (
            <div
              key={step.level}
              className={`rounded-xl border-l-4 ${step.border} border border-border-light bg-white p-5 shadow-sm`}
            >
              <p className="text-xs font-bold text-accent tracking-wide">{step.level}</p>
              <p className="mt-1 font-semibold text-text">{step.title}</p>
              <p className="mt-1.5 text-sm text-text-muted">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 보안과 비용의 해법 */}
      <section className="mb-12 animate-fade-in stagger-4">
        <h2 className="mb-4 text-lg font-bold text-text">보안과 비용의 해법</h2>
        <p className="mb-5 text-sm text-text-muted">
          기업 데이터 보안과 AI 운영 비용, 두 가지 과제를 동시에 해결합니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-light bg-surface-warm p-5 shadow-sm">
            <p className="text-sm font-semibold text-primary">자체 LLM</p>
            <p className="mt-2 text-sm text-text-muted">
              사내 서버에서 구동하는 자체 AI 모델. 민감 데이터가 외부로 나가지 않아 보안이 보장됩니다.
              API 과금 없이 무제한 사용 가능합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-border-light bg-surface-warm p-5 shadow-sm">
            <p className="text-sm font-semibold text-primary">RAG 시스템</p>
            <p className="mt-2 text-sm text-text-muted">
              사내 문서·매뉴얼을 AI가 검색·참조하여 답변합니다. 기업 고유 지식을 AI에 연결하여
              정확하고 맞춤화된 결과를 제공합니다.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-3 animate-fade-in stagger-5">
        <a
          href={`${ownerUrl}/services`}
          className="flex h-12 items-center justify-center rounded-xl bg-accent text-base font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md btn-press"
        >
          AX 서비스 신청하기
        </a>
        <Link
          href="/ax-process"
          className="flex h-12 items-center justify-center rounded-xl border-2 border-accent text-base font-semibold text-accent transition-colors hover:bg-accent/5 btn-press"
        >
          AX 프로세스 알아보기
        </Link>
      </section>
    </div>
  )
}
