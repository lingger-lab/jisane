export type UserRole = 'client' | 'partner'

// DB enum types
export type RequestStatus = 'open' | 'matching' | 'dealt' | 'closed'
export type DealStatus = 'quoted' | 'working' | 'done'
export type EscrowStatus = 'pending' | 'deposited' | 'reviewing' | 'released' | 'refunded'
export type WorkflowStep = 'intake' | 'structure' | 'generate' | 'verify' | 'deliver'
export type StepStatus = 'pending' | 'in_progress' | 'done'

// DB row types
export interface RequestRow {
  id: string
  client_id: string
  title: string
  detail: string
  req_type: string | null
  scope: string | null
  budget_hope: number | null
  status: RequestStatus
  created_at: string
  updated_at: string
}

export interface DealRow {
  id: string
  matching_id: string | null
  request_id: string | null
  partner_id: string | null
  work_fee: number
  match_fee: number
  total_pay: number
  scope: string | null
  due_date: string | null
  status: DealStatus
  created_at: string
  updated_at: string
}

export interface SettlementRow {
  id: string
  deal_id: string
  escrow_status: EscrowStatus
  payment_key: string | null
  guarantee_fee: number
  refunded_amt: number
  refund_reason: string | null
  deposited_at: string | null
  released_at: string | null
  refunded_at: string | null
  created_at: string
  updated_at: string
}

export interface DealWorkflowRow {
  id: string
  deal_id: string
  step: WorkflowStep
  status: StepStatus
  note: string | null
  done_at: string | null
  created_at: string
}

export interface PartnerRow {
  id: string
  auth_user_id: string
  provider: string | null
  email: string
  contact: string | null
  name: string | null
  field: string | null
  career_yrs: number | null
  grade: string
  status: string
  created_at: string
  updated_at: string
}

// Matching
export type MatchingStatus = 'proposed' | 'accepted' | 'rejected'

export interface MatchingRow {
  id: string
  request_id: string
  partner_id: string
  manager: string | null
  status: MatchingStatus
  created_at: string
  updated_at: string
}

// Review
export type ReviewAuthorType = 'client' | 'partner' | 'gyeotae'

export interface ReviewRow {
  id: string
  deal_id: string
  author_type: ReviewAuthorType
  rating: number
  comment: string | null
  internal_note: string | null
  created_at: string
}

// Guarantee Fund Ledger
export type LedgerEntryType = 'accrue' | 'payout'

export interface GuaranteeFundLedgerRow {
  id: string
  settlement_id: string
  entry_type: LedgerEntryType
  amount: number
  note: string | null
  created_at: string
}

// Inquiry
export type InquiryStatus = 'open' | 'ai_answered' | 'human_routed' | 'closed'
export type ManagerName = 'park' | 'brad' | 'kim'

export interface InquiryRow {
  id: string
  author_id: string | null
  author_type: ReviewAuthorType | null
  category: string | null
  content: string
  status: InquiryStatus
  created_at: string
  updated_at: string
}
