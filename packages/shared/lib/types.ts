import type { Database } from './database.types'

// ── DB Row types (auto-generated 기반) ──────────────────────────
export type ClientRow = Database['public']['Tables']['client']['Row']
export type PartnerRow = Database['public']['Tables']['partner']['Row']
export type RequestRow = Database['public']['Tables']['request']['Row']
export type MatchingRow = Database['public']['Tables']['matching']['Row']
export type DealRow = Database['public']['Tables']['deal']['Row']
export type SettlementRow = Database['public']['Tables']['settlement']['Row']
export type DealWorkflowRow = Database['public']['Tables']['deal_workflow']['Row']
export type ReviewRow = Database['public']['Tables']['review']['Row']
export type InquiryRow = Database['public']['Tables']['inquiry']['Row']
export type GuaranteeFundLedgerRow = Database['public']['Tables']['guarantee_fund_ledger']['Row']
export type ServiceOrderRow = Database['public']['Tables']['service_order']['Row']
export type PartnerInterestRow = Database['public']['Tables']['partner_interest']['Row']
export type DealMessageRow = Database['public']['Tables']['deal_message']['Row']

// ── DB Enum types (auto-generated 기반) ─────────────────────────
export type RequestStatus = Database['public']['Enums']['request_status']
export type DealStatus = Database['public']['Enums']['deal_status']
export type EscrowStatus = Database['public']['Enums']['escrow_status']
export type WorkflowStep = Database['public']['Enums']['workflow_step']
export type StepStatus = Database['public']['Enums']['step_status']
export type MatchingStatus = Database['public']['Enums']['matching_status']
export type ReviewAuthorType = Database['public']['Enums']['review_author']
export type InquiryStatus = Database['public']['Enums']['inquiry_status']
export type ManagerName = Database['public']['Enums']['manager_name']
export type AuthProvider = Database['public']['Enums']['auth_provider']
export type ClientStatus = Database['public']['Enums']['client_status']
export type PartnerGrade = Database['public']['Enums']['partner_grade']
export type PartnerStatus = Database['public']['Enums']['partner_status']
export type ServiceCategory = Database['public']['Enums']['service_category']
export type OrderStatus = Database['public']['Enums']['order_status']

// ── Custom types (DB에 없는 앱 전용 타입) ───────────────────────
export type UserRole = 'client' | 'partner'
export type LedgerEntryType = 'accrue' | 'payout'

// ── 수동 타입 (새 테이블, database.types.ts 갱신 전 사용) ────────
export interface CategoryRow {
  id: string
  parent_id: string | null
  depth: number
  label: string
  slug: string
  sort_order: number
  created_at: string
}

export interface PartnerCategoryRow {
  partner_id: string
  category_id: string
}

export interface MatchingCandidateRow {
  id: string
  request_id: string
  partner_id: string
  rank: number
  score: number
  score_detail: Record<string, number> | null
  status: string
  auto_assign_at: string | null
  created_at: string
}

export interface ReviewAiSuggestionRow {
  id: string
  deal_id: string
  process_rating: number
  result_rating: number
  response_rating: number
  overall_rating: number
  reasoning: string | null
  status: string
  created_at: string
}
