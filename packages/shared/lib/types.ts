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
