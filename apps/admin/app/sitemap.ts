// 커스텀 Next 포크의 metadata route-entry 생성기가 workspace/type import 파싱을 실패시켜
// robots/sitemap은 self-contained(임포트 없음)로 둔다. base URL은 앱 고정값.
const BASE = 'https://jisane.cloud'

export default function sitemap() {
  const lastModified = new Date()
  const routes = [
    { path: '/', priority: 1, changeFrequency: 'weekly' as const },
    { path: '/service', priority: 0.9, changeFrequency: 'monthly' as const },
    { path: '/knowledge', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/ax', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/ax-process', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/standard', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/standard/scope', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/standard/guarantee', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/partner', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/join', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/event/senior100', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' as const },
  ]
  return routes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
