import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = '지사네 시니어공간'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f5c46',
          color: '#fbf9f3',
        }}
      >
        {/* Owl */}
        <svg width="120" height="120" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="26" r="17" fill="#fbf9f3" />
          <circle cx="18" cy="22" r="6" fill="#1f5c46" />
          <circle cx="30" cy="22" r="6" fill="#1f5c46" />
          <circle cx="18" cy="22" r="2.6" fill="#153f30" />
          <circle cx="30" cy="22" r="2.6" fill="#153f30" />
          <path d="M21 27 L24 30 L27 27 Z" fill="#b06a1e" />
          <path d="M14 10 Q18 15 21 17 M34 10 Q30 15 27 17" stroke="#fbf9f3" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 24, letterSpacing: '-0.02em' }}>
          지사네
        </div>
        <div style={{ fontSize: 28, marginTop: 12, opacity: 0.85 }}>
          시니어공간 — 일은 사람이 합니다
        </div>
      </div>
    ),
    { ...size }
  )
}
