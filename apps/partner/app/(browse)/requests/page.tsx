import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { RequestList } from './request-list'

export const metadata = {
  title: '열린 의뢰 탐색 - 지사네 시니어공간',
  description: '시니어 전문가를 찾는 기업의 의뢰를 카테고리별로 탐색하세요.',
}

interface PageProps {
  searchParams: Promise<{ category?: string }>
}

export default async function RequestsPage(props: PageProps) {
  const { category } = await props.searchParams

  // 선택적 인증 (공개 페이지 — 리다이렉트 없음)
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  let partnerId: string | null = null
  if (user) {
    const { data: partner } = await adminClient
      .from('partner')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    partnerId = partner?.id ?? null
  }

  // 병렬 쿼리: 카테고리 목록 + 관심 표현 목록
  const [{ data: categories }, interestsResult] = await Promise.all([
    adminClient
      .from('category')
      .select('id, parent_id, depth, label, sort_order')
      .order('sort_order'),
    partnerId
      ? adminClient.from('partner_interest').select('request_id').eq('partner_id', partnerId)
      : Promise.resolve({ data: [] as { request_id: string }[] }),
  ])

  const allCategories = categories ?? []

  // 카테고리 필터 적용하여 의뢰 조회
  let requestsQuery = adminClient
    .from('request')
    .select('id, title, detail, req_type, budget_hope, category_id, created_at, client:client!inner(company)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50)

  if (category) {
    const selectedCat = allCategories.find((c) => c.id === category)
    if (selectedCat && selectedCat.depth === 1) {
      // mid-category: 자기 자신 + depth=2 자식들
      const childIds = allCategories
        .filter((c) => c.parent_id === category && c.depth === 2)
        .map((c) => c.id)
      requestsQuery = requestsQuery.in('category_id', [category, ...childIds])
    } else if (selectedCat && selectedCat.depth === 0) {
      // major-category: 산하 모든 mid + detail
      const midIds = allCategories
        .filter((c) => c.parent_id === category && c.depth === 1)
        .map((c) => c.id)
      const detailIds = allCategories
        .filter((c) => midIds.includes(c.parent_id) && c.depth === 2)
        .map((c) => c.id)
      requestsQuery = requestsQuery.in('category_id', [...midIds, ...detailIds])
    }
  }

  const { data: requests } = await requestsQuery

  const interestedIds = (interestsResult.data ?? []).map((i) => i.request_id)

  // 카테고리 계층 구조 생성
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
      <div className="w-full max-w-md px-4 py-6">
        <RequestList
          requests={(requests ?? []).map((r) => ({
            id: r.id,
            title: r.title,
            detail: r.detail,
            reqType: r.req_type,
            budgetHope: r.budget_hope,
            categoryId: r.category_id,
            createdAt: r.created_at,
            company: (r.client as unknown as { company: string | null })?.company ?? null,
          }))}
          categoryTree={categoryTree}
          selectedCategory={category ?? null}
          interestedIds={interestedIds}
          isAuthenticated={!!user}
          isPartner={!!partnerId}
        />
      </div>
    </div>
  )
}
