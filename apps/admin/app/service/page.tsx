import Link from 'next/link'

export const metadata = {
  title: '서비스 안내 | 지사네',
}

const STEPS = [
  { num: '01', title: '의뢰 등록', desc: '기업이 필요한 작업을 자유롭게 등록합니다.' },
  { num: '02', title: '지사네 매니저 검토', desc: '매니저가 의뢰를 확인하고 적합한 시니어를 선정합니다.' },
  { num: '03', title: '시니어 전문가 매칭', desc: '검증된 시니어 전문가에게 매칭을 제안합니다.' },
  { num: '04', title: '에스크로 결제', desc: '기업이 견적을 승인하면 에스크로로 안전하게 결제합니다.' },
  { num: '05', title: '작업 진행·검수', desc: '5단계 워크플로우를 통해 체계적으로 작업을 진행합니다.' },
  { num: '06', title: '정산', desc: '검수 완료 후 시니어에게 작업료 전액이 지급됩니다.' },
] as const

export default function ServicePage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <Link href="/" className="mb-8 inline-block text-sm text-text-muted hover:text-text transition-colors">
        &larr; 홈으로
      </Link>

      {/* 히어로 */}
      <section className="mb-12 animate-fade-in">
        <h1 className="text-3xl font-bold text-primary leading-tight">
          지사네 서비스 안내
        </h1>
        <p className="mt-3 text-base text-text-muted leading-relaxed">
          시니어 인력 매칭 시스템과 기업용 전문 서비스를 제공합니다.
          <br />
          부울경 지역의 검증된 시니어 전문가를 기업과 직접 연결합니다.
        </p>
      </section>

      {/* 서비스 소개 */}
      <section className="mb-12 animate-fade-in stagger-1">
        <h2 className="mb-4 text-lg font-bold text-text">지사네가 하는 일</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border-light bg-surface-warm p-5 shadow-sm">
            <p className="text-sm font-semibold text-primary">시니어 인력 매칭 시스템</p>
            <p className="mt-2 text-sm text-text-muted">
              경력 있는 시니어 전문가를 기업에 연결합니다. 지사네 매니저가 직접 검증하여 신뢰할 수 있는 매칭을 보장합니다.
            </p>
          </div>
          <div className="rounded-2xl border border-border-light bg-surface-warm p-5 shadow-sm">
            <p className="text-sm font-semibold text-accent">기업용 전문 서비스 제공</p>
            <p className="mt-2 text-sm text-text-muted">
              디자인, 마케팅, 영상, 문서 작성, 창업코칭, 정부자금 등 다양한 분야의 전문 서비스를 제공합니다.
            </p>
          </div>
        </div>
      </section>

      {/* 매칭 프로세스 */}
      <section className="mb-12 animate-fade-in stagger-2">
        <h2 className="mb-4 text-lg font-bold text-text">매칭 프로세스</h2>
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

      {/* 기업공간 */}
      <section className="mb-8 animate-fade-in stagger-3">
        <div className="rounded-2xl border border-primary/20 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-primary">기업공간</h2>
          <p className="mt-2 text-sm text-text-muted">
            검증된 시니어 전문가에게 일을 맡기세요.
            의뢰를 등록하면 지사네 매니저가 24시간 내에 적합한 시니어를 연결해드립니다.
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              시니어 인력 신청 — 필요한 작업을 자유롭게 등록
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              에스크로 안전결제 — 검수 후 정산
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              기업 수수료 0% — 매칭비만 별도
            </li>
          </ul>
          <Link
            href="/signup?role=client"
            className="mt-5 flex h-12 items-center justify-center rounded-xl bg-primary text-base font-semibold text-white shadow-sm transition-all hover:bg-primary-light hover:shadow-md btn-press"
          >
            시니어 인력 신청하기
          </Link>
        </div>
      </section>

      {/* 시니어공간 */}
      <section className="mb-12 animate-fade-in stagger-4">
        <div className="rounded-2xl border border-accent/20 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-accent">시니어공간</h2>
          <p className="mt-2 text-sm text-text-muted">
            경험을 살려 일하고, 정당한 대가를 받으세요.
            시니어로 등록하면 지사네 매니저가 적합한 의뢰를 매칭해드립니다.
          </p>
          <ul className="mt-3 flex flex-col gap-1.5 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              기업 매칭 신청 — 경력과 전문 분야를 등록
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              시니어 수수료 0% — 작업료 전액 지급
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              지사네 에스크로로 안전하게 보관
            </li>
          </ul>
          <Link
            href="/signup?role=partner"
            className="mt-5 flex h-12 items-center justify-center rounded-xl border-2 border-accent text-base font-semibold text-accent transition-colors hover:bg-accent/5 btn-press"
          >
            기업 매칭 신청하기
          </Link>
        </div>
      </section>

      {/* 신뢰 근거 */}
      <section className="rounded-xl border border-border-light bg-surface-warm p-5 animate-fade-in stagger-5">
        <h3 className="mb-3 text-xs font-semibold tracking-wide text-text-subtle uppercase">지사네가 약속합니다</h3>
        <ul className="flex flex-col gap-2 text-sm text-text-muted">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            지사네 전문가 네트워크가 직접 검증합니다
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            에스크로 안전결제 · 검수 후 정산
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
            지사네 책임 적립금으로 거래 안전 보장
          </li>
        </ul>
      </section>
    </div>
  )
}
