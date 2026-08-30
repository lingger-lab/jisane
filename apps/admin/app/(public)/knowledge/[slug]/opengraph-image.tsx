import { ImageResponse } from 'next/og'
import { getPackageBySlug } from '@jisane/shared/service-package/queries'
import { formatPackagePrice, CATEGORY_LABELS } from '@jisane/shared/service-catalog'

// 카탈로그 항목별 OG 카드 — SNS·AI 미리보기 품질↑. 패키지 조회를 위해 nodejs 런타임(edge 아님).
export const alt = '지사네 지식서비스'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const pkg = await getPackageBySlug(slug).catch(() => null)
  const name = pkg?.name ?? '지식서비스'
  const provider = pkg?.provider ?? '지사네'
  const category = pkg ? CATEGORY_LABELS[pkg.category] : ''
  const price = pkg ? formatPackagePrice(pkg) : ''

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#1f5c46',
          color: '#fbf9f3',
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="26" r="17" fill="#fbf9f3" />
            <circle cx="18" cy="22" r="6" fill="#1f5c46" />
            <circle cx="30" cy="22" r="6" fill="#1f5c46" />
            <circle cx="18" cy="22" r="2.6" fill="#153f30" />
            <circle cx="30" cy="22" r="2.6" fill="#153f30" />
            <path d="M21 27 L24 30 L27 27 Z" fill="#b06a1e" />
            <path d="M14 10 Q18 15 21 17 M34 10 Q30 15 27 17" stroke="#fbf9f3" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 34, fontWeight: 700 }}>지사네 지식서비스</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {category ? <div style={{ fontSize: 32, opacity: 0.8 }}>{category}</div> : null}
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.15, letterSpacing: '-0.02em' }}>{name}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 34 }}>
          <div style={{ opacity: 0.85 }}>{provider}</div>
          <div style={{ fontWeight: 700 }}>{price}</div>
        </div>
      </div>
    ),
    { ...size },
  )
}
