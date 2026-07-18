/**
 * Supabase relational select 쿼리의 nested join 타입 정의
 *
 * Supabase TypeScript SDK는 !inner join 시 배열 타입을 반환하는데,
 * FK가 unique인 경우 실제로는 단일 객체입니다. 이 파일에서 명시적 타입을
 * 정의하여 `as unknown as` 캐스트를 제거합니다.
 *
 * v2: client→owner, partner→expert, career_yrs→career_years
 */

// ── 공통 연락처 타입 ──
export interface OwnerContact {
  company: string | null
  ceo_name: string | null
  email: string
  contact: string | null
}

export interface ExpertContact {
  name: string | null
  email: string
  contact: string | null
}

// ── Request + nested owner (admin dashboard, matching-tab) ──
export interface RequestWithOwner {
  id: string
  title: string
  detail: string
  req_type: string | null
  budget_hope: number | null
  created_at: string
  owner: OwnerContact
}

// ── Deal + nested request/expert (admin dashboard, progress-tab) ──
export interface DealWithRelations {
  id: string
  work_fee: number
  match_fee: number
  total_pay: number
  status: string
  due_date: string | null
  created_at: string
  request: { id: string; title: string; req_type: string | null; owner: OwnerContact }
  expert: { id: string; name: string | null; field: string | null; email: string; contact: string | null }
}

// ── Deal ownership verification (owner app) ──
export interface DealWithOwnership {
  id: string
  status: string
  request_id: string
  expert_id: string
  request: {
    id: string
    owner_id: string
    owner: { auth_user_id: string }
  }
}

// ── Deal with owner_id only (message ownership) ──
export interface DealWithOwnerId {
  id: string
  status: string
  request_id: string
  request: { id: string; owner_id: string }
}

// ── Settlement + nested deal/request/expert (admin settlement-tab) ──
export interface SettlementWithDeal {
  id: string
  deal_id: string
  escrow_status: string
  guarantee_fee: number
  deposited_at: string | null
  created_at: string
  auto_processed: boolean | null
  queue_status: string | null
  audit_sampled: boolean | null
  deal: {
    id: string
    work_fee: number
    match_fee: number
    total_pay: number
    status: string
    request: { id: string; title: string; owner: OwnerContact }
    expert: { id: string; name: string | null }
  }
}

// ── Settlement + flat deal (owner API route) ──
export interface SettlementWithDealFlat {
  id: string
  deal_id: string
  escrow_status: string
  guarantee_fee: number
  deposited_at: string | null
  released_at: string | null
  created_at: string
  deal: {
    id: string
    request_id: string
    expert_id: string
    work_fee: number
    match_fee: number
    total_pay: number
    status: string
  }
}

// ── Review-input deal ──
export interface DealForReview {
  id: string
  work_fee: number
  match_fee: number
  total_pay: number
  status: string
  request: { id: string; title: string; req_type: string | null; detail: string }
  expert: { id: string; name: string | null; field: string | null; career_years: number | null }
}

// ── Expert interest with nested expert ──
export interface InterestWithExpert {
  expert_id: string
  note: string | null
  expert: {
    id: string
    name: string | null
    field: string | null
    career_years: number | null
  }
}

// ── Ledger entry (simplified) ──
export interface LedgerEntry {
  id: string
  settlement_id: string | null
  entry_type: string
  amount: number
  note: string | null
  created_at: string
}

// ── Service order (simplified) ──
export interface ServiceOrderItem {
  id: string
  category: string
  package_slug: string
  package_name: string
  price: number
  status: string
  detail: string | null
  created_at: string
  owner_id: string | null
  expert_id: string | null
  provider_id: string | null
  is_free: boolean
  owner: OwnerContact | null
  expert: ExpertContact | null
  provider: { name: string; type: string } | null
}

// ── Proposed matching (admin dashboard, proposed-tab) ──
export interface ProposedMatchingItem {
  id: string
  status: string
  created_at: string
  request: { id: string; title: string; req_type: string | null; budget_hope: number | null; owner: OwnerContact }
  expert: { id: string; name: string | null; field: string | null; email: string; contact: string | null }
}

// ── Invitation + nested owner (partner/expert side) ──
export interface InvitationWithOwner {
  id: string
  status: string
  est_hours: number | null
  est_amount: number | null
  cap_amount: number | null
  created_at: string
  owner: { id: string; company: string | null; ceo_name: string | null; email: string; completed_deals: number }
  request: { id: string; title: string; detail: string; req_type: string | null; budget_hope: number | null } | null
}

// ── Invitation (admin side — both owner + expert) ──
export interface InvitationAdminItem {
  id: string
  status: string
  est_hours: number | null
  est_amount: number | null
  cap_amount: number | null
  created_at: string
  owner: { id: string; company: string | null; ceo_name: string | null; email: string }
  expert: { id: string; name: string | null; field: string | null }
  request: { id: string; title: string } | null
}

// ── Dispute item (admin dashboard) ──
export interface DisputeItem {
  id: string
  target_type: string
  target_id: string
  raised_by: string
  reason: string
  status: string
  created_at: string
  updated_at: string
}

// ── Inquiry item ──
export interface InquiryItem {
  id: string
  author_id: string | null
  author_type: string | null
  author_email: string | null
  category: string | null
  content: string
  status: string
  created_at: string
}
