import { ImageResponse } from 'next/og'

/**
 * 브랜드 J 모노그램 아이콘 — 딥그린 배경 + 크림 세리프 "J". 파비콘·apple-touch·PWA(홈 화면) 공용.
 * maskable 대응: 배경이 정사각을 꽉 채우고 J는 중앙(세이프존) → iOS/Android가 알아서 라운딩.
 * 엣지 렌더(ImageResponse). 색은 팔레트 동결값(#1f5c46 primary / #fbf9f3 한지 크림)과 일치.
 */
export function brandJIcon(size: number): ImageResponse {
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
          fontSize: Math.round(size * 0.6),
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          paddingBottom: Math.round(size * 0.04),
        }}
      >
        J
      </div>
    ),
    { width: size, height: size },
  )
}
