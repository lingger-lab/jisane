import Link from 'next/link'
import { PageHero } from '@jisane/ui/page-hero'

export const metadata = {
  title: '지사네 표준 | 먼저 꺼내놓는 다섯 가지',
  description:
    '지사네가 거래 전에 먼저 꺼내놓는 다섯 가지 — 값·범위·약속·몫·복구. 감추지 않는 것이 표준입니다.',
}

const PRINCIPLES = [
  {
    num: '1',
    item: '값',
    desc: '수수료율을 계약 전에 확인합니다',
    detail:
      '매칭비 7구간 단가를 사전 공개합니다. 거래가 끝난 뒤에야 수수료를 알게 되는 일이 없도록, 계약 전에 얼마가 어디로 가는지 먼저 보여드립니다.',
    href: '',
  },
  {
    num: '2',
    item: '범위',
    desc: '업무 범위, 착수 전에 못 박습니다',
    detail:
      '오해의 90%는 "해줄 줄 알았는데"에서 나옵니다. 용역 명세서로 "이건 합니다 / 이건 안 합니다"를 착수 전에 명문화합니다.',
    href: '/standard/scope',
    linkLabel: '용역 명세서 양식 보기',
  },
  {
    num: '3',
    item: '약속',
    desc: '대금, 에스크로에 먼저 보관합니다',
    detail:
      '발주자가 먼저 입금하면 지사네 에스크로에 보관됩니다. 작업 완료·검수 확인 후에 시니어지식인에게 정산됩니다. 선정산도, 떼먹힘도 구조적으로 차단합니다.',
    href: '',
  },
  {
    num: '4',
    item: '몫',
    desc: '분배 구조, 숨기지 않습니다',
    detail:
      '시니어지식인 수수료 0% — 작업료 전액이 시니어지식인에게 갑니다. 지사네의 수익은 발주자가 사전에 확인한 매칭비뿐입니다.',
    href: '',
  },
  {
    num: '5',
    item: '복구',
    desc: '문제 시, 적립금으로 먼저 보전합니다',
    detail:
      '매칭비의 10%를 책임적립금으로 쌓아둡니다. 거래에 문제가 생기면 다투기 전에 적립금으로 먼저 복구합니다.',
    href: '/standard/guarantee',
    linkLabel: '책임적립금 규정 보기',
  },
]

export default function StandardIndexPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHero
        eyebrow="지사네 표준"
        title="먼저 꺼내놓는 다섯 가지"
        subtitle="감추는 것이 관행이 된 시장에서, 지사네는 먼저 꺼내놓는 것을 표준으로 삼습니다. 거래 전에 이 다섯 가지를 확인하실 수 있습니다."
        size="lg"
      />
      <div className="responsive-container px-4 md:px-6 py-6">
      <div className="flex flex-col gap-4">
        {PRINCIPLES.map((p) => (
          <section key={p.item} className="rounded-xl border border-border-light bg-white p-5 md:p-6 shadow-xs">
            <div className="flex items-center gap-4">
              <span className="text-xl md:text-2xl font-bold text-primary shrink-0 w-7 text-center">{p.num}</span>
              <div>
                <h2 className="text-base font-semibold text-text">{p.item}</h2>
                <p className="text-sm text-text-muted">{p.desc}</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-text-muted">{p.detail}</p>
            {p.href && (
              <Link
                href={p.href}
                className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
              >
                {p.linkLabel} &rarr;
              </Link>
            )}
          </section>
        ))}
      </div>

      <p className="mt-8 text-xs text-text-subtle">
        거래 표준 문서: <Link href="/standard/scope" className="underline hover:text-text-muted">① 용역 명세서</Link>
        {' · '}
        <Link href="/standard/guarantee" className="underline hover:text-text-muted">② 책임적립금 규정</Link>
      </p>
      </div>
    </div>
  )
}
