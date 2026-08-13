import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import Link from 'next/link'
import { getCachedCategories } from '@jisane/shared/categories'
import { PageHero } from '@jisane/ui/page-hero'
import { RequestList } from './request-list'

export const metadata = {
  title: '열린 의뢰 탐색 - 지사네 시니어지식인회원',
  description: '시니어지식인을 찾는 기업의 의뢰를 카테고리별로 탐색하세요.',
}

interface PageProps {
  searchParams: Promise<{ category?: string; q?: string }>
}

export default async function RequestsPage(props: PageProps) {
  const { category, q } = await props.searchParams
  const query = (q ?? '').trim()

  // 선택적 인증 (공개 페이지 — 리다이렉트 없음)
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  let expertId: string | null = null
  if (user) {
    const { data: expert } = await adminClient
      .from('expert')
      .select('id')
      .eq('auth_user_id', user.id)
      .single()
    expertId = expert?.id ?? null
  }

  // 병렬 쿼리: 카테고리 목록 (캐시) + 관심 표현 목록
  const [allCategories, interestsResult] = await Promise.all([
    getCachedCategories(adminClient),
    expertId
      ? adminClient.from('expert_interest').select('request_id').eq('expert_id', expertId)
      : Promise.resolve({ data: [] as { request_id: string }[], error: null }),
  ])
  // 관심 표현 조회 실패는 목록 자체를 막지 않는 보조 데이터 — 서버 기록만 남긴다.
  if (interestsResult.error) {
    console.error('[requests] expert_interest query failed:', interestsResult.error.message)
  }

  // 카테고리 필터 적용하여 의뢰 조회
  let requestsQuery = adminClient
    .from('request')
    .select('id, title, detail, req_type, budget_hope, category_id, created_at, owner:owner!inner(company)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(50)

  if (category) {
    // 평면 12(v3): category는 depth 0. request.category_id가 직접 참조하므로 그대로 필터.
    const selectedCat = allCategories.find((c) => c.id === category)
    if (selectedCat) {
      requestsQuery = requestsQuery.eq('category_id', category)
    }
  }

  // 검색어: 제목·내용 부분 일치 (카테고리 필터와 공존)
  if (query) {
    // PostgREST .or()의 구조 문자(괄호·쉼표)와 LIKE 와일드카드(%,_)를 제거한다.
    // 안 지우면 괄호 포함 검색어가 or-트리를 깨 400 → 가짜 빈 결과가 된다(감사 docs/10 P1-7, 코드 P2-21).
    const safe = query.replace(/[%_,()]/g, '')
    requestsQuery = requestsQuery.or(`title.ilike.%${safe}%,detail.ilike.%${safe}%`)
  }

  const { data: requests, error: requestsError } = await requestsQuery
  // 쿼리 실패를 조용히 빈 결과로 렌더하지 않도록 서버에 기록하고,
  // 빈 상태 대신 에러 상태를 렌더한다(감사 docs/11 P2-21).
  if (requestsError) {
    console.error('[requests] search query failed:', requestsError.message)
  }

  const interestedIds = (interestsResult.data ?? []).map((i) => i.request_id)

  // 카테고리 목록 (평면 12)
  const categoryTree = allCategories
    .filter((c) => c.depth === 0)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({ id: c.id, label: c.label }))

  return (
    <div className="flex flex-1 flex-col">
      <PageHero
        eyebrow="시니어지식인회원"
        title="열린 의뢰 탐색"
        subtitle="시니어지식인을 찾는 기업의 의뢰를 카테고리별로 탐색하세요."
        back={<Link href="/" className="text-sm text-white/70 hover:text-white transition-colors">&larr; 홈</Link>}
      />
      <div className="container-app w-full px-4 md:px-6 py-6 md:py-8">
        <RequestList
          requests={(requests ?? []).map((r) => ({
            id: r.id,
            title: r.title,
            detail: r.detail,
            reqType: r.req_type,
            budgetHope: r.budget_hope,
            categoryId: r.category_id,
            createdAt: r.created_at,
            company: (r.owner as unknown as { company: string | null })?.company ?? null,
          }))}
          categoryTree={categoryTree}
          selectedCategory={category ?? null}
          query={query}
          interestedIds={interestedIds}
          isAuthenticated={!!user}
          isExpert={!!expertId}
          loadFailed={Boolean(requestsError)}
        />
      </div>
    </div>
  )
}
