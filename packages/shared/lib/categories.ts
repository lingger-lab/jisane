/** 카테고리 계층 구조 유틸리티 + 캐싱 */

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
