/** 카테고리 계층 구조 유틸리티 + 캐싱 */

/**
 * 카테고리 평면 12분류 — UI 칩/카드 렌더용 단일 소스 (v3, 0035 마이그레이션).
 * DB `category` 테이블(depth 0, 12개)과 동기이며, categories.test.ts가 라벨·순서를 고정한다.
 * 서버는 라벨 exact-match(depth 0)로 category_id를 찾으므로 DB 시드와 라벨이 정확히 일치해야 한다.
 * 이전 3단계(대→중→소) 트리는 폐기됨 — 실 배정이 전부 중분류였고 소분류는 미사용이었다.
 */
export const CATEGORY_LABELS = [
  '경영·전략',
  '재무·회계',
  '마케팅·브랜딩',
  '영업·사업개발',
  '인사·조직',
  'AI·디지털',
  '생산·품질',
  'R&D·기술',
  '법률·정책',
  '창업·스타트업',
  '교육·코칭·리더십',
  '문서·행정',
] as const

export type CategoryLabel = (typeof CATEGORY_LABELS)[number]

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
