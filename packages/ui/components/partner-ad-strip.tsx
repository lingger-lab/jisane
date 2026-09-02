import { cn } from '../lib/cn'

/**
 * 제휴 파트너 광고 스트립 — 고정 3파트너 배너(정적 SVG, public/ads). 데스크톱 728×90 / 모바일 320×50
 * 반응형 교체, 각 배너에 '광고' 표시(표시광고법), 링크는 rel="sponsored"(구글 유료링크 규정).
 * 정적이라 색인 대상 아님. 배너 SVG는 admin·owner 두 앱 public/ads에 동일 배치.
 */

interface PartnerAd {
  key: string
  name: string
  desktop: string
  mobile: string
  href: string | null // 광고주 링크(있으면 클릭 이동, 없으면 표시 전용)
}

const PARTNER_ADS: PartnerAd[] = [
  { key: 'enterlabs', name: '엔터랩스 · AI 업무자동화 파트너', desktop: '/ads/enterlabs_728x90.svg', mobile: '/ads/enterlabs_320x50.svg', href: null },
  { key: 'bukyung', name: '부경회계법인 · 박정철 회계사', desktop: '/ads/bukyung_728x90.svg', mobile: '/ads/bukyung_320x50.svg', href: null },
  { key: 'bom', name: '세무회계 봄 · 추봉조 세무사', desktop: '/ads/bom_728x90.svg', mobile: '/ads/bom_320x50.svg', href: null },
]

function AdCard({ ad }: { ad: PartnerAd }) {
  const inner = (
    <div className="relative overflow-hidden rounded-lg border border-border-light bg-card">
      {/* 광고 표시 — 표시광고법 */}
      <span className="absolute right-1.5 top-1.5 z-10 rounded bg-black/45 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white/90">
        광고
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element — 정적 SVG(신뢰 자산), next/image SVG 설정 불필요 */}
      <img src={ad.desktop} alt={`${ad.name} 광고`} width={728} height={90} className="hidden h-auto w-full sm:block" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ad.mobile} alt={`${ad.name} 광고`} width={320} height={50} className="mx-auto block h-auto w-full max-w-[360px] sm:hidden" />
    </div>
  )
  if (ad.href) {
    return (
      <a href={ad.href} target="_blank" rel="sponsored nofollow noopener" aria-label={`${ad.name} (광고)`} className="block focus-ring rounded-lg">
        {inner}
      </a>
    )
  }
  return inner
}

export function PartnerAdStrip({ className }: { className?: string }) {
  return (
    <section aria-label="제휴 파트너 광고" className={cn('w-full', className)}>
      <div className="mx-auto flex w-full max-w-[728px] flex-col gap-2 px-4">
        <p className="text-xs font-medium text-text-subtle">제휴 파트너</p>
        {PARTNER_ADS.map((ad) => (
          <AdCard key={ad.key} ad={ad} />
        ))}
      </div>
    </section>
  )
}
