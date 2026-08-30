import { getAllPublishedPackages } from '@jisane/shared/service-package/queries'
import { formatPackagePrice, CATEGORY_LABELS } from '@jisane/shared/service-catalog'

// llms-full.txt — 답변엔진/RAG용 전체 카탈로그. 1시간 ISR로 DB 변경 반영.
export const revalidate = 3600

export async function GET() {
  let catalog = ''
  try {
    const pkgs = await getAllPublishedPackages()
    const lines = pkgs.map(
      (p) =>
        `- ${p.name} [${CATEGORY_LABELS[p.category]} · ${formatPackagePrice(p)}] — ` +
        `${(p.valueDesc || p.description || '').slice(0, 90)} · https://jisane.cloud/knowledge/${p.slug}`,
    )
    catalog = `## 전체 지식서비스 (${pkgs.length}건)\n${lines.join('\n')}\n`
  } catch {
    catalog = '## 전체 지식서비스\n(목록을 불러오지 못했습니다 — https://jisane.cloud/knowledge 참조)\n'
  }

  const body = `# 지사네 (Jisane) — 전체 정보 (llms-full)

> 부울경(부산·울산·경남) 중소기업을 위한 전문 서비스와 시니어 전문가 정보를 연결하는 지식나눔 사업협력 네트워크. 운영: (주)지사네. 온사이트 AI(RAG) 상담 제공.

요약본은 https://jisane.cloud/llms.txt 를 참조하세요. 이 문서는 전체 지식서비스 목록을 포함합니다.

## 제공 서비스 (5대 지원 분야)
- 경영·마케팅 사업화 지원 — 사업 아이템 구체화·시장 진입 전략
- 재무·세무·회계 경영컨설팅 — 자금·세무·회계 구조 진단과 자문
- 기술·생산 품질관리 지원 — 생산 공정·품질 체계 개선
- 온라인·홍보 판로개척 지원 — 온라인 채널·홍보로 판로 확대
- AI·AX 지원 — AI 도입·업무 전환(AX)으로 생산성 향상

## 이용 절차
접수 → 합의 → 결제(에스크로) → 작업 → 정산의 5단계. 조건을 먼저 확인하고 맡기는 안전 직거래.

## 비용·상담
- 회원 가입: 무료
- 상담 문의: 무료 — 지사네의 모든 상담 문의는 무료입니다. 이름·연락처만 남기면 담당 매니저가 1영업일 내 연락
- 서비스 비용: 서비스별 상이(상담으로 안내, 일부는 상담 문의)
- 시니어 전문가는 작업료 전액 수령(작업료 수수료 0%)

## 신뢰·안전
지사네 거래 표준 5원칙(값·범위·약속·몫·복구) + 에스크로 + 책임 적립금. 문제가 생기면 지사네가 먼저 움직입니다.

## 회원 유형
- 기업회원: 전문 서비스 신청·시니어 전문가 정보 열람 (owner.jisane.cloud)
- 시니어지식인회원: 의뢰 수임·작업료 전액 수령 (expert.jisane.cloud)
- 전문가회원(파트너): 전문 서비스 직접 등록·제공(관리자 승인제)

${catalog}
## 대상 지역
부산광역시·울산광역시·경상남도(부울경) 중소기업

## 연락처
이메일: iamblackwhite86@gmail.com
`

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
