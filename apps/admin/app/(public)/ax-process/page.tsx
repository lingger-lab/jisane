import Link from 'next/link'

export const metadata = {
  title: 'AX 전환 프로세스 | 지사네',
  description: 'AX(AI Transformation) 전환의 4단계 프로세스와 구현 방식',
}

const PROCESS_STEPS = [
  {
    num: '01',
    title: '진단',
    desc: 'AX 5대 적용축 기반으로 현재 업무를 분석합니다.',
    items: [
      '업무 프로세스 현황 파악',
      '반복·비효율 영역 식별',
      'AX 5가치 기반 우선순위 선정',
      '첫 AI 실험 대상 확정',
    ],
  },
  {
    num: '02',
    title: '실험',
    desc: '최우선 1곳에 AI를 적용해 빠르게 효과를 확인합니다.',
    items: [
      'AI 도구·모델 선정',
      '파일럿 워크플로우 구축',
      '담당자 교육·핸즈온',
      '2주 운영 후 결과 수집',
    ],
  },
  {
    num: '03',
    title: '측정',
    desc: '비용 절감·수익 향상 효과를 정량적으로 측정합니다.',
    items: [
      'Before/After 비교 분석',
      '비용 절감액 산출',
      '업무 시간 단축률 측정',
      'ROI 보고서 작성',
    ],
  },
  {
    num: '04',
    title: '확장',
    desc: '측정된 결과를 바탕으로 다음 영역으로 확대합니다.',
    items: [
      '차기 적용 영역 선정',
      '자체 LLM/RAG 도입 검토',
      '구현의 사다리 다음 단계 설계',
      '분기별 확장 로드맵 수립',
    ],
  },
] as const

const IMPL_LEVELS = [
  {
    level: 'Level 1',
    title: 'AI 챗봇',
    desc: '가장 빠르게 도입할 수 있는 AI 형태입니다.',
    examples: ['고객 문의 자동 응대', 'FAQ 봇', '내부 직원 질의응답', '문서 검색 도우미'],
    border: 'border-accent/30',
  },
  {
    level: 'Level 2',
    title: '업무 자동화',
    desc: '반복 업무를 AI 워크플로우로 전환합니다.',
    examples: ['보고서 자동 생성', '데이터 정리·분류', '이메일·알림 자동화', '문서 요약·번역'],
    border: 'border-accent/60',
  },
  {
    level: 'Level 3',
    title: 'AI Agent',
    desc: '스스로 판단하고 실행하는 자율 에이전트입니다.',
    examples: ['멀티 스텝 의사결정', '영업·마케팅 자동화', '고객 맞춤 추천 시스템', '이상 탐지·대응'],
    border: 'border-accent',
  },
] as const

export default function AXProcessPage() {
  const ownerUrl = process.env.NEXT_PUBLIC_OWNER_URL || 'https://owner.jisane.cloud'

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/ax" className="mb-8 inline-block text-sm text-text-muted hover:text-text transition-colors">
        &larr; AX 전환이란?
      </Link>

      {/* 히어로 */}
      <section className="mb-12 animate-fade-in">
        <p className="mb-2 text-sm font-semibold text-accent tracking-wide">Process</p>
        <h1 className="text-3xl font-bold text-primary leading-tight">
          AX 전환 프로세스
        </h1>
        <p className="mt-4 text-base text-text-muted leading-relaxed">
          진단 &rarr; 실험 &rarr; 측정 &rarr; 확장.
          <br />
          4단계를 반복하며 AI 전환을 체계적으로 완성합니다.
        </p>
      </section>

      {/* 4단계 프로세스 */}
      <section className="mb-12 animate-fade-in stagger-1">
        <h2 className="mb-5 text-lg font-bold text-text">4단계 프로세스</h2>
        <div className="flex flex-col gap-4">
          {PROCESS_STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`rounded-xl border border-border-light bg-white p-5 shadow-sm animate-fade-in stagger-${Math.min(i + 1, 5)}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                  {step.num}
                </span>
                <div>
                  <p className="font-semibold text-text">{step.title}</p>
                  <p className="text-sm text-text-muted">{step.desc}</p>
                </div>
              </div>
              <ul className="flex flex-col gap-1.5 pl-[52px]">
                {step.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/40" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* 구현 방식 */}
      <section className="mb-12 animate-fade-in stagger-2">
        <h2 className="mb-4 text-lg font-bold text-text">구현 방식 — 구현의 사다리</h2>
        <p className="mb-5 text-sm text-text-muted">
          각 단계에서 적합한 구현 수준을 선택합니다. 작은 성공을 쌓으며 점진적으로 올라갑니다.
        </p>
        <div className="flex flex-col gap-4">
          {IMPL_LEVELS.map((lvl) => (
            <div
              key={lvl.level}
              className={`rounded-xl border-l-4 ${lvl.border} border border-border-light bg-white p-5 shadow-sm`}
            >
              <p className="text-xs font-bold text-accent tracking-wide">{lvl.level}</p>
              <p className="mt-1 font-semibold text-text">{lvl.title}</p>
              <p className="mt-1 text-sm text-text-muted">{lvl.desc}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {lvl.examples.map((ex) => (
                  <span key={ex} className="rounded-full bg-accent/5 px-3 py-1 text-xs text-accent">
                    {ex}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 보안 인프라 */}
      <section className="mb-12 animate-fade-in stagger-3">
        <h2 className="mb-4 text-lg font-bold text-text">보안 인프라</h2>
        <p className="mb-5 text-sm text-text-muted">
          기업 데이터가 외부로 유출되지 않으면서도 AI의 혜택을 누리는 방법입니다.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-light bg-surface-warm p-5 shadow-sm">
            <p className="text-sm font-semibold text-primary">자체 LLM</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                사내 서버에서 AI 모델 구동
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                민감 데이터 외부 전송 없음
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                API 과금 없이 무제한 사용
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                기업 맞춤 파인튜닝 가능
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-border-light bg-surface-warm p-5 shadow-sm">
            <p className="text-sm font-semibold text-primary">RAG 시스템</p>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-muted">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                사내 문서·매뉴얼 AI 연결
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                정확한 맥락 기반 답변
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                기업 고유 지식 활용
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary/40" />
                실시간 문서 업데이트 반영
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col gap-3 animate-fade-in stagger-4">
        <a
          href={`${ownerUrl}/services`}
          className="flex h-12 items-center justify-center rounded-xl bg-accent text-base font-semibold text-white shadow-sm transition-all hover:bg-accent/90 hover:shadow-md btn-press"
        >
          AX 무료 진단 신청하기
        </a>
        <Link
          href="/ax"
          className="flex h-12 items-center justify-center rounded-xl border-2 border-accent text-base font-semibold text-accent transition-colors hover:bg-accent/5 btn-press"
        >
          AX 전환이란?
        </Link>
      </section>
    </div>
  )
}
