import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATEGORY_LABELS } from './categories'

// 평면 12분류 단일소스 고정 테스트 (v3, 0035 마이그레이션).
// 1) CATEGORY_LABELS가 12개 고정 라벨임을 고정하고,
// 2) DB 마이그레이션(0035)이 삽입하는 12 라벨·순서와 일치하는지 검증한다 —
//    서버 액션이 라벨 exact-match(depth 0)로 category_id를 찾으므로(silent null on drift)
//    시드와 어긋나면 이 테스트가 빨간불로 알려야 한다.

const migPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../supabase/migrations/0035_category_v3_flat12.sql'
)

describe('CATEGORY_LABELS — 평면 12분류 (v3)', () => {
  it('12개 고정 라벨이다', () => {
    expect(CATEGORY_LABELS).toEqual([
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
    ])
  })

  it('0035 마이그레이션이 삽입하는 12 라벨·순서와 정확히 일치한다', () => {
    const sql = readFileSync(migPath, 'utf8')
    // INSERT INTO category ... VALUES ('라벨','slug',순번) 3-튜플만 파싱(_catmap 2-튜플은 제외)
    const rows: { label: string; ord: number }[] = []
    for (const line of sql.split('\n')) {
      const m = line.match(/^\s*\('([^']+)','([^']+)',(\d+)\)/)
      if (m) rows.push({ label: m[1], ord: Number(m[3]) })
    }
    const seedLabels = rows.sort((a, b) => a.ord - b.ord).map((r) => r.label)
    expect(seedLabels).toEqual([...CATEGORY_LABELS])
  })
})
