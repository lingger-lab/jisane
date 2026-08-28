import type { MetadataRoute } from 'next'

// 웹 앱 매니페스트 — 모바일/데스크탑 "홈 화면에 추가" 시 J 아이콘으로 앱처럼 실행(standalone).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '지사네',
    short_name: '지사네',
    description: '부울경 중소기업 전문 서비스와 시니어 전문가 정보 — 지식나눔 사업협력 네트워크',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf9f3',
    theme_color: '#1f5c46',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
