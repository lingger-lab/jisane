// self-contained (커스텀 Next 포크 route-entry가 workspace/type import 파싱 실패)
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/mypage', '/status', '/request', '/services', '/experts', '/education', '/callback'],
    },
    sitemap: 'https://owner.jisane.cloud/sitemap.xml',
    host: 'https://owner.jisane.cloud',
  }
}
