// self-contained (커스텀 Next 포크 route-entry가 workspace/type import 파싱 실패)
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/mypage', '/requests', '/work', '/matching', '/invitations', '/register', '/callback'],
    },
    sitemap: 'https://expert.jisane.cloud/sitemap.xml',
    host: 'https://expert.jisane.cloud',
  }
}
