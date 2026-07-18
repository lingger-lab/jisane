import { adminClient } from './supabase/admin'
import { getCachedCategories } from './categories'

// ── TTL 캐시 (10분) ──────────────────────────────
const STATS_TTL = 10 * 60 * 1000

let ownerStatsCache: { data: OwnerLandingStats; ts: number } | null = null
let expertStatsCache: { data: ExpertLandingStats; ts: number } | null = null

// ── 타입 ──────────────────────────────────────────

export interface CategoryCount {
  majorId: string
  majorLabel: string
  midCategories: { id: string; label: string; count: number }[]
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

  // 카테고리별 전문가 수
  const categories = allCats
  const expertCats = expertCatsRes.data ?? []

  const midCountMap = new Map<string, number>()
  for (const pc of expertCats) {
    midCountMap.set(pc.category_id, (midCountMap.get(pc.category_id) ?? 0) + 1)
  }

  const majors = categories.filter((c) => c.depth === 0).sort((a, b) => a.sort_order - b.sort_order)
  const mids = categories.filter((c) => c.depth === 1)

  const categoryCounts: CategoryCount[] = majors.map((major) => ({
    majorId: major.id,
    majorLabel: major.label,
    midCategories: mids
      .filter((m) => m.parent_id === major.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        id: m.id,
        label: m.label,
        count: midCountMap.get(m.id) ?? 0,
      })),
  }))

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

  ownerStatsCache = { data: result, ts: Date.now() }
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

  // 카테고리별 의뢰 수
  const categories = allCats
  const requestCats = requestCatsRes.data ?? []

  // category_id는 depth=2(세부)일 수 있으므로 mid(depth=1)로 집계
  const catMap = new Map(categories.map((c) => [c.id, c]))
  const midCountMap = new Map<string, number>()

  for (const rc of requestCats) {
    if (!rc.category_id) continue
    const cat = catMap.get(rc.category_id)
    if (!cat) continue
    // depth=1이면 그대로, depth=2면 parent_id가 mid
    const midId = cat.depth === 1 ? cat.id : cat.depth === 2 ? cat.parent_id : null
    if (midId) {
      midCountMap.set(midId, (midCountMap.get(midId) ?? 0) + 1)
    }
  }

  const majors = categories.filter((c) => c.depth === 0).sort((a, b) => a.sort_order - b.sort_order)
  const mids = categories.filter((c) => c.depth === 1)

  const categoryCounts: CategoryCount[] = majors.map((major) => ({
    majorId: major.id,
    majorLabel: major.label,
    midCategories: mids
      .filter((m) => m.parent_id === major.id)
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((m) => ({
        id: m.id,
        label: m.label,
        count: midCountMap.get(m.id) ?? 0,
      })),
  }))

  const result: ExpertLandingStats = {
    totalOwners,
    totalOpenRequests,
    totalCompletedDeals,
    avgBudget,
    newRequestsThisMonth,
    categoryCounts,
  }

  expertStatsCache = { data: result, ts: Date.now() }
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
