import { adminClient } from '@jisane/shared/supabase/admin'
import { ExpertList } from './expert-list'

export const metadata = {
  title: '분야별 전문가 탐색 - 지사네 기업공간',
  description: '부울경 검증된 시니어 전문가를 분야별로 탐색하세요.',
}

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function ExpertsPage(props: PageProps) {
  const { category } = await props.searchParams

  // 카테고리 목록 + 전문가 목록 병렬 조회
  const [{ data: categories }, { data: allPartnerCats }] = await Promise.all([
    adminClient
      .from('category')
      .select('id, parent_id, depth, label, sort_order')
      .order('sort_order'),
    adminClient
      .from('partner_category')
      .select('partner_id, category_id'),
  ])

  const allCategories = categories ?? []
  const partnerCats = allPartnerCats ?? []

  // 카테고리 필터로 대상 partner_id 추출
  let targetPartnerIds: string[] | null = null

  if (category) {
    const selectedCat = allCategories.find((c) => c.id === category)
    let filterCatIds: string[] = []

    if (selectedCat && selectedCat.depth === 1) {
      filterCatIds = [category]
    } else if (selectedCat && selectedCat.depth === 0) {
      filterCatIds = allCategories
        .filter((c) => c.parent_id === category && c.depth === 1)
        .map((c) => c.id)
    }

    if (filterCatIds.length > 0) {
      const ids = new Set(
        partnerCats
          .filter((pc) => filterCatIds.includes(pc.category_id))
          .map((pc) => pc.partner_id)
      )
      targetPartnerIds = [...ids]
    }
  }

  // 전문가 조회
  let partnersQuery = adminClient
    .from('partner')
    .select('id, name, field, career_yrs, grade')
    .eq('status', 'active')
    .order('career_yrs', { ascending: false })
    .limit(50)

  if (targetPartnerIds !== null) {
    if (targetPartnerIds.length === 0) {
      // 해당 카테고리에 전문가 없음
      partnersQuery = partnersQuery.in('id', ['__none__'])
    } else {
      partnersQuery = partnersQuery.in('id', targetPartnerIds)
    }
  }

  const { data: partners } = await partnersQuery

  // 전문가별 카테고리 매핑 (표시용)
  const partnerIdSet = new Set((partners ?? []).map((p) => p.id))
  const partnerCatMap = new Map<string, string[]>()
  for (const pc of partnerCats) {
    if (!partnerIdSet.has(pc.partner_id)) continue
    const cat = allCategories.find((c) => c.id === pc.category_id)
    if (!cat || cat.depth !== 1) continue
    const existing = partnerCatMap.get(pc.partner_id) ?? []
    existing.push(cat.label)
    partnerCatMap.set(pc.partner_id, existing)
  }

  // 카테고리 계층 구조
  const majors = allCategories
    .filter((c) => c.depth === 0)
    .sort((a, b) => a.sort_order - b.sort_order)
  const mids = allCategories.filter((c) => c.depth === 1)

  const categoryTree = majors.map((major) => ({
    id: major.id,
    label: major.label,
    midCategories: mids
      .filter((m) => m.parent_id === major.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({ id: m.id, label: m.label })),
  }))

  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="responsive-container px-4 md:px-6 py-6 md:py-8">
        <ExpertList
          experts={(partners ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            field: p.field,
            careerYrs: p.career_yrs,
            grade: p.grade,
            categories: partnerCatMap.get(p.id) ?? [],
          }))}
          categoryTree={categoryTree}
          selectedCategory={category ?? null}
        />
      </div>
    </div>
  )
}
