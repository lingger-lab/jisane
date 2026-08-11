/** 카테고리 계층 구조 유틸리티 + 캐싱 */

/**
 * 카테고리 트리 정적 정의 (대분류 → 중분류) — UI 칩/탭 렌더용 단일 소스.
 * DB `category` 테이블 시드(supabase/migrations/0020_v2_seed.sql, depth 0·1)와 동기이며,
 * categories.test.ts가 시드 SQL과의 라벨·순서 일치를 고정한다(감사 P2-40).
 * 시드/DB 카테고리를 바꾸면 이 트리도 함께 갱신할 것 — 서버는 라벨 exact-match로 category_id를 찾는다.
 */
export const CATEGORY_TREE = [
  { label: '경영·창업', children: ['창업코칭', '사업계획서', '정부자금·보조금', '경영진단'] },
  { label: 'AI·디지털전환', children: ['AI진단', 'AEO최적화', '업무자동화', '데이터분석'] },
  { label: '문서·행정', children: ['제안서·기획서', '보고서', '매뉴얼·가이드', '번역·통역'] },
  { label: '생산·품질', children: ['품질관리', '생산관리', 'ISO·인증', '안전관리'] },
  { label: '연구개발', children: ['R&D 기획', '기술개발', '특허·지식재산', '기술이전·사업화'] },
  { label: '전문서비스', children: ['세무·회계', '법무', '노무', '마케팅'] },
  { label: '크리에이티브', children: ['디자인', '웹개발', '영상제작', '콘텐츠제작'] },
] as const

/** 모듈 레벨 TTL 캐시 (5분) — 카테고리 데이터는 자주 변하지 않음 */
let categoryCache: { data: CategoryRow[]; ts: number } | null = null
const CATEGORY_TTL = 5 * 60 * 1000

export async function getCachedCategories(
  adminClient: { from: (table: string) => any }
): Promise<CategoryRow[]> {
  if (categoryCache && Date.now() - categoryCache.ts < CATEGORY_TTL) {
    return categoryCache.data
  }
  const { data } = await adminClient
    .from('category')
    .select('id, parent_id, depth, label, slug, sort_order')
    .order('sort_order')
  const rows = (data ?? []) as CategoryRow[]
  categoryCache = { data: rows, ts: Date.now() }
  return rows
}

export interface CategoryRow {
  id: string
  parent_id: string | null
  depth: number
  label: string
  slug: string
  sort_order: number
}

/** category_id로부터 "대분류 > 중분류" 라벨 생성 */
export function getCategoryBreadcrumb(
  rows: CategoryRow[],
  categoryId: string
): string {
  const map = new Map(rows.map((r) => [r.id, r]))
  const cat = map.get(categoryId)
  if (!cat) return ''

  if (cat.depth === 0) return cat.label
  if (cat.depth === 1) {
    const parent = cat.parent_id ? map.get(cat.parent_id) : null
    return parent ? `${parent.label} > ${cat.label}` : cat.label
  }
  // depth === 2
  const mid = cat.parent_id ? map.get(cat.parent_id) : null
  if (!mid) return cat.label
  const major = mid.parent_id ? map.get(mid.parent_id) : null
  return major
    ? `${major.label} > ${mid.label} > ${cat.label}`
    : `${mid.label} > ${cat.label}`
}
