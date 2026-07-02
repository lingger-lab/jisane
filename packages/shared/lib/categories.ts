/** 카테고리 계층 구조 유틸리티 */

export interface CategoryRow {
  id: string
  parent_id: string | null
  depth: number
  label: string
  slug: string
  sort_order: number
}

export interface CategoryNode {
  id: string
  label: string
  slug: string
  depth: number
  sort_order: number
  children: CategoryNode[]
}

/** DB에서 조회한 flat 카테고리 배열 → 트리 구조로 변환 */
export function buildCategoryTree(rows: CategoryRow[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>()

  for (const row of rows) {
    map.set(row.id, {
      id: row.id,
      label: row.label,
      slug: row.slug,
      depth: row.depth,
      sort_order: row.sort_order,
      children: [],
    })
  }

  const roots: CategoryNode[] = []
  for (const row of rows) {
    const node = map.get(row.id)!
    if (row.parent_id && map.has(row.parent_id)) {
      map.get(row.parent_id)!.children.push(node)
    } else if (!row.parent_id) {
      roots.push(node)
    }
  }

  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sort_order - b.sort_order)
    for (const n of nodes) sortNodes(n.children)
  }
  sortNodes(roots)

  return roots
}

/** 대분류(depth=0) 목록 반환 */
export function getMajorCategories(rows: CategoryRow[]): CategoryRow[] {
  return rows
    .filter((r) => r.depth === 0)
    .sort((a, b) => a.sort_order - b.sort_order)
}

/** 중분류(depth=1) 목록 반환 */
export function getMidCategories(rows: CategoryRow[]): CategoryRow[] {
  return rows
    .filter((r) => r.depth === 1)
    .sort((a, b) => a.sort_order - b.sort_order)
}

/** 특정 대분류 하위의 중분류 반환 */
export function getMidCategoriesByParent(
  rows: CategoryRow[],
  parentId: string
): CategoryRow[] {
  return rows
    .filter((r) => r.depth === 1 && r.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
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
