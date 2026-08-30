import Link from 'next/link'
import { pageMetadata } from '@jisane/shared/seo'
import { PageHero } from '@jisane/ui/page-hero'

export const metadata = pageMetadata('admin', {
  title: '지사네 소개',
  description:
    '지사네는 부울경(부산·울산·경남) 중소기업의 전문 서비스와 시니어 전문가를 연결하는 지식나눔 사업협력 네트워크입니다. 운영: (주)지사네.',
  path: '/about',
})

const PILLARS = [
  ['경영·마케팅 사업화 지원', '사업 아이템 구체화·시장 진입 전략'],
  ['재무·세무·회계 경영컨설팅', '자금·세무·회계 구조 진단과 자문'],
  ['기술·생산 품질관리 지원', '생산 공정·품질 체계 개선'],
  ['온라인·홍보 판로개척 지원', '온라인 채널·홍보로 판로 확대'],
  ['AI·AX 지원', 'AI 도입·업무 전환(AX)으로 생산성 향상'],
]

const MEMBERS = [
  ['기업회원', '전문 서비스를 신청하고 시니어 전문가 정보를 열람합니다.'],
  ['시니어지식인회원', '의뢰를 수임하고 작업료 전액을 수령합니다(작업료 수수료 0%).'],
  ['전문가회원(파트너)', '전문 서비스를 직접 등록·제공합니다(관리자 승인제).'],
]

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHero
        container="read"
        eyebrow="지사네 소개"
        title="지역 기업과 시니어 전문가를 잇는 지식나눔 네트워크"
        subtitle="부산·울산·경남(부울경) 중소기업을 위한 전문 서비스와 시니어 전문가 정보"
        size="lg"
      />
      <div className="container-read px-4 md:px-6 py-8 flex flex-col gap-10 text-text-muted leading-relaxed">
        <section>
          <p>
            <strong className="text-text">지사네</strong>는 부울경(부산·울산·경남) 중소기업이 필요한 전문 서비스를 신청하고,
            경험·노하우를 갖춘 <strong className="text-text">시니어 전문가(시니어지식인)</strong>에게 일을 맡길 수 있는
            지식나눔 사업협력 네트워크입니다. 조건을 먼저 확인하고 맡기는 <strong className="text-text">에스크로 안전 직거래</strong>를
            지향하며, 사이트에 <strong className="text-text">AI(RAG) 상담</strong>을 탑재해 방문자의 질문에 즉시 답합니다. 운영은 (주)지사네입니다.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">제공 서비스 — 5대 지원 분야</h2>
          <ul className="flex flex-col gap-2">
            {PILLARS.map(([name, desc]) => (
              <li key={name} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>
                  <strong className="text-text">{name}</strong> — {desc}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/service" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            서비스 안내 자세히 보기 &rarr;
          </Link>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">이용 절차</h2>
          <p>접수 → 합의 → 결제(에스크로) → 작업 → 정산의 5단계로 진행됩니다. 조건을 먼저 확인하고 맡기는 안전 직거래 방식입니다.</p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">비용·상담</h2>
          <p>
            회원 가입은 무료입니다. <strong className="text-text">지사네의 모든 상담 문의는 무료</strong>이며, 관심 있는 서비스에서
            이름·연락처만 남기면 담당 매니저가 1영업일 내 연락드립니다. 서비스 비용은 서비스별로 상이하며 상담으로 안내합니다.
            시니어 전문가는 작업료 전액을 수령합니다(작업료 수수료 0%).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">신뢰·안전</h2>
          <p>
            지사네 거래 표준 5원칙(값·범위·약속·몫·복구)과 에스크로, 책임 적립금 운영으로 문제가 생기면 지사네가 먼저 움직입니다.
          </p>
          <Link href="/standard" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
            거래 표준 자세히 보기 &rarr;
          </Link>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">회원 유형</h2>
          <ul className="flex flex-col gap-2">
            {MEMBERS.map(([name, desc]) => (
              <li key={name} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  <strong className="text-text">{name}</strong> — {desc}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-serif font-bold text-text">대상 지역·연락처</h2>
          <p>부산광역시·울산광역시·경상남도(부울경) 중소기업을 주 대상으로 합니다. 문의: iamblackwhite86@gmail.com</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm font-medium text-primary">
            <Link href="/knowledge" className="hover:underline">지식서비스 둘러보기 &rarr;</Link>
            <Link href="/service" className="hover:underline">서비스 안내 &rarr;</Link>
          </div>
        </section>
      </div>
    </div>
  )
}
