/**
 * Supabase relational select 쿼리의 nested join 타입 정의
 *
 * Supabase TypeScript SDK는 !inner join 시 배열 타입을 반환하는데,
 * FK가 unique인 경우 실제로는 단일 객체입니다. 이 파일에서 명시적 타입을
 * 정의하여 `as unknown as` 캐스트를 제거합니다.
 */

// ── Deal + nested request/partner (admin dashboard, progress-tab) ──
export interface DealWithRelations {
  id: string
  work_fee: number
  match_fee: number
  total_pay: number
  status: string
  due_date: string | null
  created_at: string
  request: { id: string; title: string; req_type: string | null }
  partner: { id: string; name: string | null; field: string | null }
}

// ── Deal ownership verification (owner app) ──
export interface DealWithOwnership {
  id: string
  status: string
  request_id: string
  partner_id: string
  request: {
    id: string
    client_id: string
    client: { auth_user_id: string }
  }
}

// ── Deal with client_id only (message ownership) ──
export interface DealWithClientId {
  id: string
  status: string
  request_id: string
  request: { id: string; client_id: string }
}

// ── Settlement + nested deal/request/partner (admin settlement-tab) ──
export interface SettlementWithDeal {
  id: string
  deal_id: string
  escrow_status: string
  guarantee_fee: number
  deposited_at: string | null
  created_at: string
  deal: {
    id: string
    work_fee: number
    match_fee: number
    total_pay: number
    status: string
    request: { id: string; title: string }
    partner: { id: string; name: string | null }
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
    partner_id: string
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
  partner: { id: string; name: string | null; field: string | null; career_yrs: number | null }
}

// ── Partner interest with nested partner ──
export interface InterestWithPartner {
  partner_id: string
  note: string | null
  partner: {
    id: string
    name: string | null
    field: string | null
    career_yrs: number | null
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
  client_id: string | null
  partner_id: string | null
}

// ── Inquiry item ──
export interface InquiryItem {
  id: string
  author_type: string | null
  category: string | null
  content: string
  status: string
  created_at: string
}
