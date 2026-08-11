import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATEGORY_TREE } from './categories'

// 카테고리 트리 단일소스화(감사 docs/11 P2-40) 고정 테스트.
// 1) 구 로컬 사본(owner request-form CATEGORY_TREE, expert lib/fields FIELD_GROUPS)과
//    1비트도 다르지 않은 값임을 고정하고,
// 2) DB 시드(0020_v2_seed.sql)의 depth 0·1 라벨과 실제로 일치하는지 검증한다 —
//    서버 액션이 라벨 exact-match로 category_id를 찾으므로(silent null on drift)
//    시드와 트리가 어긋나면 이 테스트가 빨간불로 알려야 한다.

const seedPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../supabase/migrations/0020_v2_seed.sql'
)

interface SeedCategoryRow {
  id: string
  parent_id: string | null
  depth: number
  label: string
  sort_order: number
}

/** 0020_v2_seed.sql의 `INSERT INTO category` 구문에서 행을 파싱 */
function parseSeedCategories(): SeedCategoryRow[] {
  const sql = readFileSync(seedPath, 'utf8')
  const rows: SeedCategoryRow[] = []
  let inCategoryInsert = false
  for (const line of sql.split('\n')) {
    if (/^INSERT INTO category\b/.test(line)) inCategoryInsert = true
    if (inCategoryInsert) {
      const m = line.match(
        /^\s*\('([^']+)',\s*(?:null|'([^']+)'),\s*(\d+),\s*'([^']*)',\s*'[^']*',\s*(\d+)\)\s*[,;]/
      )
      if (m) {
        rows.push({
          id: m[1],
          parent_id: m[2] ?? null,
          depth: Number(m[3]),
          label: m[4],
          sort_order: Number(m[5]),
        })
      }
      if (line.trimEnd().endsWith(';')) inCategoryInsert = false
    }
  }
  return rows
}

describe('CATEGORY_TREE — P2-40 교체 전후 값 동일성', () => {
  it('구 로컬 사본(request-form·fields.ts)과 동일한 값이다', () => {
    expect(CATEGORY_TREE).toEqual([
      { label: '경영·창업', children: ['창업코칭', '사업계획서', '정부자금·보조금', '경영진단'] },
      { label: 'AI·디지털전환', children: ['AI진단', 'AEO최적화', '업무자동화', '데이터분석'] },
      { label: '문서·행정', children: ['제안서·기획서', '보고서', '매뉴얼·가이드', '번역·통역'] },
      { label: '생산·품질', children: ['품질관리', '생산관리', 'ISO·인증', '안전관리'] },
      { label: '연구개발', children: ['R&D 기획', '기술개발', '특허·지식재산', '기술이전·사업화'] },
      { label: '전문서비스', children: ['세무·회계', '법무', '노무', '마케팅'] },
      { label: '크리에이티브', children: ['디자인', '웹개발', '영상제작', '콘텐츠제작'] },
    ])
  })
})

describe('CATEGORY_TREE ↔ DB 시드 동기 (0020_v2_seed.sql)', () => {
  it('depth 0·1 라벨·순서가 시드와 정확히 일치한다', () => {
    const rows = parseSeedCategories()
    expect(rows.length).toBeGreaterThan(0)

    const majors = rows
      .filter((r) => r.depth === 0)
      .sort((a, b) => a.sort_order - b.sort_order)
    const seedTree = majors.map((major) => ({
      label: major.label,
      children: rows
        .filter((r) => r.depth === 1 && r.parent_id === major.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((r) => r.label),
    }))

    // as const readonly 튜플 → 비교용 plain 구조로 변환
    const tree = CATEGORY_TREE.map((g) => ({ label: g.label, children: [...g.children] }))
    expect(tree).toEqual(seedTree)
  })
})
