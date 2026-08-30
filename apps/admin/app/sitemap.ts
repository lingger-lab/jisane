// 커스텀 Next 포크의 metadata route-entry 생성기가 workspace/type import 파싱을 실패시켜
// robots/sitemap은 self-contained(임포트 없음)로 둔다. base URL은 앱 고정값.
// 동적 카탈로그(/knowledge/[slug])는 import 대신 인라인 fetch로 PostgREST에서 slug를 읽는다.
const BASE = 'https://jisane.cloud'

// 1시간 ISR — DB 변경(신규/보관 서비스)을 sitemap에 주기 반영.
export const revalidate = 3600

type Entry = {
  url: string
  lastModified: Date
  changeFrequency: 'yearly' | 'monthly' | 'weekly' | 'daily'
  priority: number
}

/** 공개 서비스 slug를 PostgREST에서 직접 조회(서버 전용, 키는 클라에 노출 안 됨). 실패 시 빈 배열. */
async function fetchPackageEntries(fallback: Date): Promise<Entry[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return []
    const res = await fetch(
      `${url}/rest/v1/service_package?select=slug,updated_at&status=eq.published&visible=eq.true`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 3600 } },
    )
    if (!res.ok) return []
    const rows: { slug: string; updated_at: string | null }[] = await res.json()
    return rows.map((r) => ({
      url: `${BASE}/knowledge/${r.slug}`,
      lastModified: r.updated_at ? new Date(r.updated_at) : fallback,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))
  } catch {
    return [] // sitemap은 정적 라우트만으로도 유효 — 동적 실패가 전체를 깨지 않게
  }
}

export default async function sitemap(): Promise<Entry[]> {
  const lastModified = new Date()
  const staticRoutes: { path: string; priority: number; changeFrequency: Entry['changeFrequency'] }[] = [
    { path: '/', priority: 1, changeFrequency: 'weekly' },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/service', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/knowledge', priority: 0.9, changeFrequency: 'weekly' },
    { path: '/ax', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/ax-process', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/standard', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/standard/scope', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/standard/guarantee', priority: 0.5, changeFrequency: 'yearly' },
    { path: '/partner', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/join', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/event/senior100', priority: 0.7, changeFrequency: 'weekly' },
    { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  ]
  const staticEntries: Entry[] = staticRoutes.map((r) => ({
    url: `${BASE}${r.path}`,
    lastModified,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
  const packageEntries = await fetchPackageEntries(lastModified)
  return [...staticEntries, ...packageEntries]
}
