// self-contained (커스텀 Next 포크 route-entry가 workspace/type import 파싱 실패)
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // /education 카탈로그는 허브 /knowledge 로 canonical 집약 — 중복 색인 방지 위해 크롤 차단
      disallow: ['/mypage', '/requests', '/work', '/matching', '/invitations', '/register', '/callback', '/education'],
    },
    sitemap: 'https://expert.jisane.cloud/sitemap.xml',
    host: 'https://expert.jisane.cloud',
  }
}
