import { describe, it, expect } from 'vitest'
import {
  mapSkillToPackage,
  partitionForUpsert,
  selectStaleIds,
  type SkillHubRow,
  type SyncPackageFields,
  type ExistingSlugRow,
} from './axdashboard-sync'
import { ENTERLABS_ID, JISANE_OFFICIAL_ID } from '@jisane/shared/service-catalog'

function row(overrides: Partial<SkillHubRow> = {}): SkillHubRow {
  return {
    id: 'abc-123',
    slug: 'ai-diagnosis',
    title: 'AX 무료 진단',
    short_description: '한 줄 설명',
    description: '자세한 설명',
    features: ['리포트', '우선순위'],
    thumbnail_url: 'https://xsfcbcnrnpbuguquvlpb.supabase.co/storage/v1/object/public/skill-assets/a.png',
    price_mode: 'fixed',
    original_price: 100000,
    sale_price: 80000,
    is_featured: true,
    display_order: 5,
    category_slug: 'ai-automation',
    ...overrides,
  }
}

describe('mapSkillToPackage', () => {
  it('고정 필드·지사네 소속·source_ref를 매핑한다', () => {
    const p = mapSkillToPackage(row())
    expect(p.provider_id).toBe(JISANE_OFFICIAL_ID)
    expect(p.slug).toBe('ai-diagnosis')
    expect(p.name).toBe('AX 무료 진단')
    expect(p.value_desc).toBe('한 줄 설명')
    expect(p.deliverables).toEqual(['리포트', '우선순위'])
    expect(p.featured).toBe(true)
    expect(p.sort_order).toBe(5)
    expect(p.target_audience).toBe('owner')
    expect(p.status).toBe('published')
    expect(p.source_ref).toBe('axd:abc-123')
  })

  it('pillar는 자동분류로 포함, visible은 미포함(관리자 노출 보존)', () => {
    const p = mapSkillToPackage(row({ category_slug: 'ai-automation' }))
    expect(p.pillar).toBe('ai_ax')
    expect('visible' in p).toBe(false)
  })

  describe('가격 3분기', () => {
    it('fixed & sale>0 → 유료', () => {
      const p = mapSkillToPackage(row({ price_mode: 'fixed', sale_price: 80000 }))
      expect(p.price).toBe(80000)
      expect(p.is_free).toBe(false)
    })
    it('fixed & sale=0 → 무료', () => {
      const p = mapSkillToPackage(row({ price_mode: 'fixed', sale_price: 0 }))
      expect(p.price).toBe(0)
      expect(p.is_free).toBe(true)
    })
    it('consult → 상담 문의(price0·is_free false)', () => {
      const p = mapSkillToPackage(row({ price_mode: 'consult', sale_price: null }))
      expect(p.price).toBe(0)
      expect(p.is_free).toBe(false)
    })
    it('fixed인데 sale null → 상담 문의', () => {
      const p = mapSkillToPackage(row({ price_mode: 'fixed', sale_price: null }))
      expect(p.price).toBe(0)
      expect(p.is_free).toBe(false)
    })
  })

  describe('배너 — https 절대경로만', () => {
    it('https → 유지', () => {
      expect(mapSkillToPackage(row()).banner_url).toMatch(/^https:\/\//)
    })
    it('상대경로 → null', () => {
      expect(mapSkillToPackage(row({ thumbnail_url: '/portfolio/a.png' })).banner_url).toBeNull()
    })
    it('http(비보안) → null', () => {
      expect(mapSkillToPackage(row({ thumbnail_url: 'http://x/a.png' })).banner_url).toBeNull()
    })
    it('null → null', () => {
      expect(mapSkillToPackage(row({ thumbnail_url: null })).banner_url).toBeNull()
    })
  })

  describe('description 폴백', () => {
    it('description 우선', () => {
      expect(mapSkillToPackage(row({ description: 'D', short_description: 'S' })).description).toBe('D')
    })
    it('description 없으면 short_description', () => {
      expect(mapSkillToPackage(row({ description: null, short_description: 'S' })).description).toBe('S')
    })
    it('둘 다 없으면 title', () => {
      expect(mapSkillToPackage(row({ description: null, short_description: null, title: 'T' })).description).toBe('T')
    })
  })

  describe('카테고리 맵', () => {
    it('gov-rnd → biz_consulting', () => {
      expect(mapSkillToPackage(row({ category_slug: 'gov-rnd' })).category).toBe('biz_consulting')
    })
    it('content-marketing → education', () => {
      expect(mapSkillToPackage(row({ category_slug: 'content-marketing' })).category).toBe('education')
    })
    it('ai-automation → ax_consulting', () => {
      expect(mapSkillToPackage(row({ category_slug: 'ai-automation' })).category).toBe('ax_consulting')
    })
    it('미지정/null → ax_consulting', () => {
      expect(mapSkillToPackage(row({ category_slug: null })).category).toBe('ax_consulting')
    })
  })

  it('features null → 빈 배열, value_desc null → 빈 문자열', () => {
    const p = mapSkillToPackage(row({ features: null, short_description: null }))
    expect(p.deliverables).toEqual([])
    expect(p.value_desc).toBe('')
  })
})

function payload(slug: string, id = slug): SyncPackageFields {
  return mapSkillToPackage(row({ slug, id }))
}

describe('partitionForUpsert — 충돌 가드', () => {
  it('기존 행 없으면 전부 upsert', () => {
    const r = partitionForUpsert([payload('a'), payload('b')], [])
    expect(r.toUpsert.map((p) => p.slug)).toEqual(['a', 'b'])
    expect(r.skipped).toEqual([])
  })

  it('회원 소유 slug는 skip(덮어쓰기 금지)', () => {
    const existing: ExistingSlugRow[] = [{ slug: 'a', provider_id: 'member-1', source_ref: null }]
    const r = partitionForUpsert([payload('a'), payload('b')], existing)
    expect(r.toUpsert.map((p) => p.slug)).toEqual(['b'])
    expect(r.skipped).toEqual(['a'])
  })

  it('엔터랩스 seed(source_ref null)도 skip(5대 지원 보존)', () => {
    const existing: ExistingSlugRow[] = [{ slug: 'a', provider_id: ENTERLABS_ID, source_ref: null }]
    const r = partitionForUpsert([payload('a')], existing)
    expect(r.toUpsert).toEqual([])
    expect(r.skipped).toEqual(['a'])
  })

  it('이전 동기화분(지사네 + axd:)은 upsert(재동기화)', () => {
    const existing: ExistingSlugRow[] = [{ slug: 'a', provider_id: JISANE_OFFICIAL_ID, source_ref: 'axd:a' }]
    const r = partitionForUpsert([payload('a')], existing)
    expect(r.toUpsert.map((p) => p.slug)).toEqual(['a'])
    expect(r.skipped).toEqual([])
  })

  it('엔터랩스 5대(비-sync provider)에 axd slug 충돌 시 skip(덮어쓰기 금지)', () => {
    const existing: ExistingSlugRow[] = [{ slug: 'a', provider_id: ENTERLABS_ID, source_ref: 'axd:a' }]
    const r = partitionForUpsert([payload('a')], existing)
    expect(r.skipped).toEqual(['a'])
  })
})

describe('selectStaleIds — prune', () => {
  it('수신에 없는 axd 행만 prune', () => {
    const existingAxd = [
      { id: 'id-1', source_ref: 'axd:1' },
      { id: 'id-2', source_ref: 'axd:2' },
      { id: 'id-3', source_ref: 'axd:3' },
    ]
    const incoming = new Set(['axd:1', 'axd:3'])
    expect(selectStaleIds(existingAxd, incoming)).toEqual(['id-2'])
  })

  it('source_ref null은 prune 대상 아님', () => {
    const existingAxd = [{ id: 'id-1', source_ref: null }]
    expect(selectStaleIds(existingAxd, new Set())).toEqual([])
  })
})
