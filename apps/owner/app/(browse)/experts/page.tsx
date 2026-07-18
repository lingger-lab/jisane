import { adminClient } from '@jisane/shared/supabase/admin'
import { getCachedCategories } from '@jisane/shared/categories'
import { ExpertList } from './expert-list'

export const metadata = {
  title: '분야별 전문가 탐색 - 지사네 기업공간',
  description: '부울경 전문가를 분야별로 탐색하세요.',
}

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function ExpertsPage(props: PageProps) {
  const { category } = await props.searchParams

  // 카테고리 목록 + 전문가 목록 병렬 조회
  const [allCategories, { data: allExpertCats }] = await Promise.all([
    getCachedCategories(adminClient),
    adminClient
      .from('expert_category')
      .select('expert_id, category_id'),
  ])
  const expertCats = allExpertCats ?? []

  // 카테고리 필터로 대상 expert_id 추출
  let targetExpertIds: string[] | null = null

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
        expertCats
          .filter((pc) => filterCatIds.includes(pc.category_id))
          .map((pc) => pc.expert_id)
      )
      targetExpertIds = [...ids]
    }
  }

  // 전문가 조회
  let expertsQuery = adminClient
    .from('expert')
    .select('id, name, field, career_years, grade, total_score, review_score, completion_score, activity_points')
    .eq('status', 'active')
    .order('total_score', { ascending: false })
    .order('activity_points', { ascending: false })
    .limit(50)

  if (targetExpertIds !== null) {
    if (targetExpertIds.length === 0) {
      // 해당 카테고리에 전문가 없음
      expertsQuery = expertsQuery.in('id', ['__none__'])
    } else {
      expertsQuery = expertsQuery.in('id', targetExpertIds)
    }
  }

  const { data: experts } = await expertsQuery

  // 전문가별 카테고리 매핑 (표시용)
  const expertIdSet = new Set((experts ?? []).map((p) => p.id))
  const expertCatMap = new Map<string, string[]>()
  for (const pc of expertCats) {
    if (!expertIdSet.has(pc.expert_id)) continue
    const cat = allCategories.find((c) => c.id === pc.category_id)
    if (!cat || cat.depth !== 1) continue
    const existing = expertCatMap.get(pc.expert_id) ?? []
    existing.push(cat.label)
    expertCatMap.set(pc.expert_id, existing)
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
          experts={(experts ?? []).map((p) => ({
            id: p.id,
            name: p.name,
            field: p.field,
            careerYears: p.career_years,
            grade: p.grade,
            totalScore: p.total_score,
            reviewScore: p.review_score,
            completionScore: p.completion_score,
            activityPoints: p.activity_points,
            categories: expertCatMap.get(p.id) ?? [],
          }))}
          categoryTree={categoryTree}
          selectedCategory={category ?? null}
        />
      </div>
    </div>
  )
}
