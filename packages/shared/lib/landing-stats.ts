import { adminClient } from './supabase/admin'
import { getCachedCategories } from './categories'

// ── TTL 캐시 (10분) ──────────────────────────────
const STATS_TTL = 10 * 60 * 1000

let ownerStatsCache: { data: OwnerLandingStats; ts: number } | null = null
let expertStatsCache: { data: ExpertLandingStats; ts: number } | null = null

// ── 타입 ──────────────────────────────────────────

/** 평면 12분류 — 분류별 전문가/의뢰 수 (v3) */
export interface CategoryCount {
  id: string
  label: string
  count: number
}

export interface OwnerLandingStats {
  totalExperts: number
  totalMajorFields: number
  totalCategories: number
  totalServices: number
  totalCompletedDeals: number
  avgSatisfaction: number | null
  newRequestsThisMonth: number
  categoryCounts: CategoryCount[]
}

export interface ExpertLandingStats {
  totalOwners: number
  totalOpenRequests: number
  totalCompletedDeals: number
  avgBudget: number | null
  newRequestsThisMonth: number
  categoryCounts: CategoryCount[]
}

export interface HubLandingStats {
  owner: OwnerLandingStats
  expert: ExpertLandingStats
}

// ── 공통 유틸 ─────────────────────────────────────

function firstDayOfMonth(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

// ── Owner 통계 ────────────────────────────────────

export async function fetchOwnerLandingStats(): Promise<OwnerLandingStats> {
  // TTL 캐시 히트
  if (ownerStatsCache && Date.now() - ownerStatsCache.ts < STATS_TTL) {
    return ownerStatsCache.data
  }

  // 병렬 쿼리
  const [
    expertsRes,
    dealsRes,
    satisfactionRes,
    newReqRes,
    allCats,
    expertCatsRes,
  ] = await Promise.all([
    adminClient.from('expert').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    adminClient.from('deal').select('id', { count: 'exact', head: true }).eq('status', 'done'),
    adminClient.from('review').select('rating').eq('author_type', 'owner'),
    adminClient.from('request').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth()),
    getCachedCategories(adminClient),
    adminClient.from('expert_category').select('category_id'),
  ])

  // 실패 쿼리 감지 — 0으로 위장된 통계를 10분 TTL 캐시에 굳히지 않는다(감사 docs/11 P2-61).
  // 이번 렌더는 degraded 값으로 진행하되(표현 방식은 V1 디자인 결정 보류), 캐시는 건너뛰어
  // 다음 요청이 재시도하게 한다.
  const ownerStatsPairs: Array<[string, { message: string } | null]> = [
    ['expert', expertsRes.error],
    ['deal', dealsRes.error],
    ['review', satisfactionRes.error],
    ['request(new)', newReqRes.error],
    ['expert_category', expertCatsRes.error],
  ]
  const ownerStatsErrors = ownerStatsPairs.filter(
    (pair): pair is [string, { message: string }] => pair[1] !== null
  )
  for (const [table, err] of ownerStatsErrors) {
    console.error(`[landing-stats] owner ${table} query failed:`, err.message)
  }

  const totalExperts = expertsRes.count ?? 0
  const totalCompletedDeals = dealsRes.count ?? 0
  const newRequestsThisMonth = newReqRes.count ?? 0

  // depth별 카운트 (캐싱된 카테고리 데이터 재활용)
  const totalMajorFields = allCats.filter((d) => d.depth === 0).length
  const totalCategories = allCats.filter((d) => d.depth === 1).length
  const totalServices = allCats.filter((d) => d.depth === 2).length

  // 만족도 평균
  const ratings = satisfactionRes.data ?? []
  const avgSatisfaction =
    ratings.length > 0
      ? Math.round((ratings.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratings.length) * 10) / 10
      : null

  // 분류별 전문가 수 (평면 12 — category 전부 depth 0)
  const expertCats = expertCatsRes.data ?? []
  const countMap = new Map<string, number>()
  for (const pc of expertCats) {
    countMap.set(pc.category_id, (countMap.get(pc.category_id) ?? 0) + 1)
  }
  const categoryCounts: CategoryCount[] = [...allCats]
    .filter((c) => c.depth === 0)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({ id: c.id, label: c.label, count: countMap.get(c.id) ?? 0 }))

  const result: OwnerLandingStats = {
    totalExperts,
    totalMajorFields,
    totalCategories,
    totalServices,
    totalCompletedDeals,
    avgSatisfaction,
    newRequestsThisMonth,
    categoryCounts,
  }

  if (ownerStatsErrors.length === 0) {
    ownerStatsCache = { data: result, ts: Date.now() }
  }
  return result
}

// ── Expert 통계 ──────────────────────────────────

export async function fetchExpertLandingStats(): Promise<ExpertLandingStats> {
  // TTL 캐시 히트
  if (expertStatsCache && Date.now() - expertStatsCache.ts < STATS_TTL) {
    return expertStatsCache.data
  }

  const [
    ownersRes,
    openReqRes,
    dealsRes,
    budgetRes,
    newReqRes,
    allCats,
    requestCatsRes,
  ] = await Promise.all([
    adminClient.from('owner').select('id', { count: 'exact', head: true }),
    adminClient.from('request').select('id', { count: 'exact', head: true }).eq('status', 'open'),
    adminClient.from('deal').select('id', { count: 'exact', head: true }).eq('status', 'done'),
    adminClient.from('request').select('budget_hope').gt('budget_hope', 0),
    adminClient.from('request').select('id', { count: 'exact', head: true }).gte('created_at', firstDayOfMonth()),
    getCachedCategories(adminClient),
    adminClient.from('request').select('category_id').eq('status', 'open').not('category_id', 'is', null),
  ])

  // owner 통계와 동일: 실패 쿼리가 섞인 결과는 캐시하지 않는다(P2-61)
  const expertStatsPairs: Array<[string, { message: string } | null]> = [
    ['owner', ownersRes.error],
    ['request(open)', openReqRes.error],
    ['deal', dealsRes.error],
    ['request(budget)', budgetRes.error],
    ['request(new)', newReqRes.error],
    ['request(category)', requestCatsRes.error],
  ]
  const expertStatsErrors = expertStatsPairs.filter(
    (pair): pair is [string, { message: string }] => pair[1] !== null
  )
  for (const [table, err] of expertStatsErrors) {
    console.error(`[landing-stats] expert ${table} query failed:`, err.message)
  }

  const totalOwners = ownersRes.count ?? 0
  const totalOpenRequests = openReqRes.count ?? 0
  const totalCompletedDeals = dealsRes.count ?? 0
  const newRequestsThisMonth = newReqRes.count ?? 0

  // 평균 예산
  const budgets = budgetRes.data ?? []
  const avgBudget =
    budgets.length > 0
      ? Math.round(budgets.reduce((sum, b) => sum + (b.budget_hope ?? 0), 0) / budgets.length)
      : null

  // 분류별 의뢰 수 (평면 12 — category 전부 depth 0)
  const requestCats = requestCatsRes.data ?? []
  const countMap = new Map<string, number>()
  for (const rc of requestCats) {
    if (!rc.category_id) continue
    countMap.set(rc.category_id, (countMap.get(rc.category_id) ?? 0) + 1)
  }
  const categoryCounts: CategoryCount[] = [...allCats]
    .filter((c) => c.depth === 0)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((c) => ({ id: c.id, label: c.label, count: countMap.get(c.id) ?? 0 }))

  const result: ExpertLandingStats = {
    totalOwners,
    totalOpenRequests,
    totalCompletedDeals,
    avgBudget,
    newRequestsThisMonth,
    categoryCounts,
  }

  if (expertStatsErrors.length === 0) {
    expertStatsCache = { data: result, ts: Date.now() }
  }
  return result
}

// ── Hub 통계 (Admin) ──────────────────────────────

export async function fetchHubLandingStats(): Promise<HubLandingStats> {
  const [owner, expert] = await Promise.all([
    fetchOwnerLandingStats(),
    fetchExpertLandingStats(),
  ])
  return { owner, expert }
}
