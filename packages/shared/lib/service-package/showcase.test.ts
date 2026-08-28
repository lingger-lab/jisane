import { describe, it, expect } from 'vitest'
import { pickShowcase, filterCatalog } from './showcase'
import type { ServicePackage } from '../service-catalog'

function pkg(over: Partial<ServicePackage> = {}): ServicePackage {
  return {
    slug: 's',
    category: 'ax_consulting',
    name: '이름',
    description: '설명',
    price: 0,
    deliverables: [],
    targetAudience: 'owner',
    provider: '지사네',
    providerId: 'p',
    valueDesc: '가치',
    isFree: false,
    ...over,
  }
}

describe('pickShowcase', () => {
  it('featured 우선, 그다음 createdAt desc', () => {
    const items = [
      pkg({ slug: 'a', featured: false, createdAt: '2026-01-01' }),
      pkg({ slug: 'b', featured: true, createdAt: '2026-01-02' }),
      pkg({ slug: 'c', featured: false, createdAt: '2026-03-01' }),
      pkg({ slug: 'd', featured: true, createdAt: '2026-02-01' }),
    ]
    expect(pickShowcase(items, 4).map((p) => p.slug)).toEqual(['d', 'b', 'c', 'a'])
  })

  it('n으로 자르되 최소 충당(featured 부족 시 최신으로 채움)', () => {
    const items = [
      pkg({ slug: 'a', featured: true, createdAt: '2026-01-01' }),
      pkg({ slug: 'b', featured: false, createdAt: '2026-05-01' }),
      pkg({ slug: 'c', featured: false, createdAt: '2026-04-01' }),
    ]
    expect(pickShowcase(items, 2).map((p) => p.slug)).toEqual(['a', 'b'])
  })

  it('입력 배열을 변형하지 않음(불변)', () => {
    const items = [pkg({ slug: 'a' }), pkg({ slug: 'b', featured: true })]
    const snapshot = items.map((p) => p.slug)
    pickShowcase(items, 2)
    expect(items.map((p) => p.slug)).toEqual(snapshot)
  })

  it('createdAt 없어도 안전', () => {
    const items = [pkg({ slug: 'a' }), pkg({ slug: 'b', featured: true })]
    expect(pickShowcase(items, 1).map((p) => p.slug)).toEqual(['b'])
  })
})

describe('filterCatalog', () => {
  const items = [
    pkg({ slug: 'a', name: 'AI 진단', category: 'ax_consulting', provider: '지사네' }),
    pkg({ slug: 'b', name: '세무 컨설팅', category: 'biz_consulting', description: '재무 자문' }),
    pkg({ slug: 'c', name: 'AI 워크숍', category: 'education' }),
  ]

  it('카테고리 필터', () => {
    expect(filterCatalog(items, { cat: 'education' }).map((p) => p.slug)).toEqual(['c'])
  })

  it("'all'·미지정은 전체", () => {
    expect(filterCatalog(items, { cat: 'all' })).toHaveLength(3)
    expect(filterCatalog(items, {})).toHaveLength(3)
  })

  it('검색어(이름·설명·제공자·카테고리라벨)', () => {
    expect(filterCatalog(items, { q: 'AI' }).map((p) => p.slug)).toEqual(['a', 'c'])
    expect(filterCatalog(items, { q: '재무' }).map((p) => p.slug)).toEqual(['b'])
    expect(filterCatalog(items, { q: '교육' }).map((p) => p.slug)).toEqual(['c']) // 카테고리 라벨
  })

  it('검색어+카테고리 동시', () => {
    expect(filterCatalog(items, { q: 'AI', cat: 'ax_consulting' }).map((p) => p.slug)).toEqual(['a'])
  })
})
