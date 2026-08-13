import { ImageResponse } from 'next/og'

// 브라우저 탭 파비콘 — 라운드 딥그린 배지 + 세리프 대문자 "J".
export const runtime = 'edge'
export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1f5c46',
          color: '#fbf9f3',
          fontSize: 24,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          borderRadius: 7,
          paddingBottom: 2,
        }}
      >
        J
      </div>
    ),
    { ...size },
  )
}
