-- ============================================================
-- 지사네(jisane) v2 통합 스키마 — 전면 리셋
-- 설계 문서 v1.3 + 클로드코드 지시서 기반
-- ============================================================
-- 용어 통일: client→owner, partner→expert, manager_name→admin_name
-- 신규: invitation, expert_activity, provider, dispute, platform_config
-- 유지(보조): matching, matching_candidate (AI 추천)
-- ============================================================

-- ============================================================
-- 0. 기존 객체 전부 DROP (역순)
-- ============================================================

-- 트리거 드롭 (테이블 드롭 시 자동 삭제되므로 생략 가능하나 명시)
-- 테이블 드롭 (FK 역순)
DROP TABLE IF EXISTS review_ai_suggestion CASCADE;
DROP TABLE IF EXISTS matching_candidate CASCADE;
DROP TABLE IF EXISTS deal_message CASCADE;
DROP TABLE IF EXISTS expert_interest CASCADE;
DROP TABLE IF EXISTS partner_interest CASCADE;
DROP TABLE IF EXISTS expert_category CASCADE;
DROP TABLE IF EXISTS partner_category CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS deal_workflow CASCADE;
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS guarantee_fund_ledger CASCADE;
DROP TABLE IF EXISTS settlement CASCADE;
DROP TABLE IF EXISTS service_order CASCADE;
DROP TABLE IF EXISTS deal CASCADE;
DROP TABLE IF EXISTS matching CASCADE;
DROP TABLE IF EXISTS request CASCADE;
DROP TABLE IF EXISTS expert CASCADE;
DROP TABLE IF EXISTS partner CASCADE;
DROP TABLE IF EXISTS owner CASCADE;
DROP TABLE IF EXISTS client CASCADE;
DROP TABLE IF EXISTS inquiry CASCADE;
DROP TABLE IF EXISTS invitation CASCADE;
DROP TABLE IF EXISTS expert_activity CASCADE;
DROP TABLE IF EXISTS provider CASCADE;
DROP TABLE IF EXISTS dispute CASCADE;
DROP TABLE IF EXISTS platform_config CASCADE;

-- 기존 enum 드롭
DROP TYPE IF EXISTS auth_provider CASCADE;
DROP TYPE IF EXISTS client_status CASCADE;
DROP TYPE IF EXISTS owner_status CASCADE;
DROP TYPE IF EXISTS partner_status CASCADE;
DROP TYPE IF EXISTS expert_status CASCADE;
DROP TYPE IF EXISTS partner_grade CASCADE;
DROP TYPE IF EXISTS expert_grade CASCADE;
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS matching_status CASCADE;
DROP TYPE IF EXISTS deal_status CASCADE;
DROP TYPE IF EXISTS escrow_status CASCADE;
DROP TYPE IF EXISTS review_author CASCADE;
DROP TYPE IF EXISTS inquiry_status CASCADE;
DROP TYPE IF EXISTS manager_name CASCADE;
DROP TYPE IF EXISTS admin_name CASCADE;
DROP TYPE IF EXISTS workflow_step CASCADE;
DROP TYPE IF EXISTS step_status CASCADE;
DROP TYPE IF EXISTS service_category CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS invitation_status CASCADE;
DROP TYPE IF EXISTS dispute_status CASCADE;
DROP TYPE IF EXISTS dispute_target_type CASCADE;
DROP TYPE IF EXISTS provider_type CASCADE;
DROP TYPE IF EXISTS expert_activity_type CASCADE;
DROP TYPE IF EXISTS queue_status CASCADE;
DROP TYPE IF EXISTS guarantee_entry_type CASCADE;

-- 유틸리티 함수
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;

-- ============================================================
-- 1. 유틸리티 함수
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. ENUM 타입 정의
-- ============================================================

-- 인증
CREATE TYPE auth_provider AS ENUM ('google', 'kakao', 'naver');

-- 사용자 상태
CREATE TYPE owner_status  AS ENUM ('active', 'inactive');
CREATE TYPE expert_status AS ENUM ('active', 'waiting', 'suspended');
CREATE TYPE expert_grade  AS ENUM ('veteran', 'standard', 'new');

-- 의뢰·매칭·거래
CREATE TYPE request_status  AS ENUM ('open', 'matching', 'dealt', 'closed');
CREATE TYPE matching_status AS ENUM ('proposed', 'accepted', 'rejected');
CREATE TYPE deal_status     AS ENUM ('quoted', 'working', 'done');

-- 초빙 (B안 신규)
CREATE TYPE invitation_status AS ENUM ('invited', 'accepted', 'declined');

-- 정산·에스크로
CREATE TYPE escrow_status AS ENUM ('pending', 'deposited', 'reviewing', 'released', 'refunded');

-- 보증금 원장
CREATE TYPE guarantee_entry_type AS ENUM (
  'accrual',            -- 적립
  'release',            -- 지급
  'refund',             -- 환불
  'newbie_guarantee'    -- 신규자 보증 환불 추적
);

-- 평가
CREATE TYPE review_author AS ENUM ('owner', 'expert', 'admin');

-- 문의
CREATE TYPE inquiry_status AS ENUM ('open', 'ai_answered', 'human_routed', 'closed');

-- 관리자
CREATE TYPE admin_name AS ENUM ('park', 'brad', 'kim');

-- 워크플로우
CREATE TYPE workflow_step AS ENUM ('intake', 'structure', 'generate', 'verify', 'deliver');
CREATE TYPE step_status   AS ENUM ('pending', 'in_progress', 'done');

-- 전문서비스
CREATE TYPE service_category AS ENUM ('ax_consulting', 'biz_consulting', 'education');
CREATE TYPE order_status     AS ENUM ('pending', 'paid', 'processing', 'completed', 'cancelled');

-- 제공기관
CREATE TYPE provider_type AS ENUM ('consulting', 'legal', 'tax', 'accounting', 'insurance');

-- 이의제기
CREATE TYPE dispute_status      AS ENUM ('open', 'resolved');
CREATE TYPE dispute_target_type AS ENUM ('review', 'settlement');

-- 활동 가점
CREATE TYPE expert_activity_type AS ENUM ('band_join', 'post');

-- 자동화 큐
CREATE TYPE queue_status AS ENUM ('auto_passed', 'pending_review', 'audited');

-- ============================================================
-- 3. 테이블 생성 (FK 의존성 순서)
-- ============================================================

-- ─── 3.1 OWNER (기존 client) ────────────────────────────────
CREATE TABLE owner (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider        auth_provider,
  email           text NOT NULL,
  contact         text,
  company         text,
  ceo_name        text,
  region          text,
  industry        text,
  status          owner_status NOT NULL DEFAULT 'active',
  completed_deals int NOT NULL DEFAULT 0,   -- 거래 완료 건수 (이력 뱃지)
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.2 EXPERT (기존 partner) ──────────────────────────────
CREATE TABLE expert (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id     uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  provider         auth_provider,
  email            text NOT NULL,
  contact          text,
  name             text,
  field            text,
  career_years     int,                                               -- career_yrs → career_years
  grade            expert_grade NOT NULL DEFAULT 'standard',
  status           expert_status NOT NULL DEFAULT 'active',
  -- 가격
  hourly_rate      int CHECK (hourly_rate BETWEEN 10000 AND 100000),  -- 시간당 단가
  -- 점수 체계 (콜드스타트 기본 3.0)
  career_score     numeric(3,1) NOT NULL DEFAULT 3.0,                 -- 경력점수
  review_score     numeric(3,1) NOT NULL DEFAULT 3.0,                 -- 리뷰점수
  completion_score numeric(3,1) NOT NULL DEFAULT 3.0,                 -- 완료율점수
  total_score      numeric(3,1) GENERATED ALWAYS AS (
    ROUND((career_score * 1 + review_score * 2 + completion_score * 1) / 4, 1)
  ) STORED,                                                           -- 종합점수
  activity_points  numeric(5,1) NOT NULL DEFAULT 0,                   -- 활동지표 (별도)
  is_newbie        boolean NOT NULL DEFAULT true,                     -- 리뷰 3건 미만
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.3 CATEGORY (3단 계층) ────────────────────────────────
CREATE TABLE category (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid REFERENCES category(id) ON DELETE CASCADE,
  depth      smallint NOT NULL DEFAULT 0,
  label      text NOT NULL,
  slug       text UNIQUE NOT NULL,
  sort_order smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.4 EXPERT_CATEGORY (다대다) ───────────────────────────
CREATE TABLE expert_category (
  expert_id   uuid NOT NULL REFERENCES expert(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  PRIMARY KEY (expert_id, category_id)
);

-- ─── 3.5 REQUEST (의뢰) ────────────────────────────────────
CREATE TABLE request (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES owner(id) ON DELETE CASCADE,   -- client_id → owner_id
  title       text NOT NULL,
  detail      text NOT NULL,
  req_type    text,
  scope       text,
  budget_hope int,
  category_id uuid REFERENCES category(id),
  status      request_status NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.6 MATCHING (AI/관리자 매칭 — 보조 유지) ──────────────
CREATE TABLE matching (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES request(id) ON DELETE CASCADE,
  expert_id   uuid NOT NULL REFERENCES expert(id),                    -- partner_id → expert_id
  manager     admin_name,                                             -- manager_name → admin_name
  status      matching_status NOT NULL DEFAULT 'proposed',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.7 DEAL (거래) ────────────────────────────────────────
CREATE TABLE deal (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  matching_id     uuid UNIQUE REFERENCES matching(id),
  invitation_id   uuid UNIQUE,                                        -- 초빙 경로용 (FK 후 추가)
  request_id      uuid REFERENCES request(id),
  expert_id       uuid REFERENCES expert(id),                         -- partner_id → expert_id
  work_fee        int NOT NULL,
  match_fee       int NOT NULL,
  total_pay       int NOT NULL,
  scope           text,
  due_date        date,
  status          deal_status NOT NULL DEFAULT 'quoted',
  -- 자동화 필드
  auto_processed  boolean NOT NULL DEFAULT false,
  queue_status    queue_status NOT NULL DEFAULT 'pending_review',
  audit_sampled   boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.8 INVITATION (B안 초빙 — 신규) ──────────────────────
CREATE TABLE invitation (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES owner(id) ON DELETE CASCADE,
  expert_id   uuid NOT NULL REFERENCES expert(id) ON DELETE CASCADE,
  request_id  uuid REFERENCES request(id),                            -- 선택적 (의뢰 없이도 초빙 가능)
  status      invitation_status NOT NULL DEFAULT 'invited',
  est_hours   int,                                                    -- expert 예상 소요시간
  est_amount  int,                                                    -- 예상총액 = est_hours × hourly_rate
  cap_amount  int,                                                    -- 캡 = est_amount (고정 정산)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- deal.invitation_id FK 연결
ALTER TABLE deal ADD CONSTRAINT fk_deal_invitation
  FOREIGN KEY (invitation_id) REFERENCES invitation(id);

-- ─── 3.9 SETTLEMENT (정산) ──────────────────────────────────
CREATE TABLE settlement (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         uuid NOT NULL UNIQUE REFERENCES deal(id) ON DELETE CASCADE,
  escrow_status   escrow_status NOT NULL DEFAULT 'pending',
  payment_key     text,
  guarantee_fee   int NOT NULL DEFAULT 0,
  refunded_amt    int NOT NULL DEFAULT 0,
  refund_reason   text,
  deposited_at    timestamptz,
  released_at     timestamptz,
  refunded_at     timestamptz,
  -- 자동화 필드
  auto_processed  boolean NOT NULL DEFAULT false,
  queue_status    queue_status NOT NULL DEFAULT 'pending_review',
  audit_sampled   boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.10 GUARANTEE_FUND_LEDGER (보증금 원장) ───────────────
CREATE TABLE guarantee_fund_ledger (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id uuid REFERENCES settlement(id),
  entry_type    guarantee_entry_type NOT NULL,                        -- text → enum
  amount        int NOT NULL,
  balance_after int,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.11 DEAL_WORKFLOW (5단계 워크플로우) ──────────────────
CREATE TABLE deal_workflow (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     uuid NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  step        workflow_step NOT NULL,
  status      step_status NOT NULL DEFAULT 'pending',
  note        text,
  done_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (deal_id, step)
);

-- ─── 3.12 REVIEW (평가) ────────────────────────────────────
CREATE TABLE review (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         uuid NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  author_type     review_author NOT NULL,                             -- owner/expert/admin (gyeotae→admin)
  rating          int CHECK (rating BETWEEN 1 AND 5),
  process_rating  smallint CHECK (process_rating BETWEEN 1 AND 5),
  result_rating   smallint CHECK (result_rating BETWEEN 1 AND 5),
  response_rating smallint CHECK (response_rating BETWEEN 1 AND 5),
  comment         text,
  internal_note   text,
  -- 자동화 필드
  auto_processed  boolean NOT NULL DEFAULT false,
  queue_status    queue_status NOT NULL DEFAULT 'pending_review',
  audit_sampled   boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.13 REVIEW_AI_SUGGESTION (AI 평가 제안 — 유지) ────────
CREATE TABLE review_ai_suggestion (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id         uuid NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  process_rating  smallint NOT NULL CHECK (process_rating BETWEEN 1 AND 5),
  result_rating   smallint NOT NULL CHECK (result_rating BETWEEN 1 AND 5),
  response_rating smallint NOT NULL CHECK (response_rating BETWEEN 1 AND 5),
  overall_rating  smallint NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  reasoning       text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.14 INQUIRY (문의·챗봇) ───────────────────────────────
CREATE TABLE inquiry (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid,
  author_type review_author,                                          -- owner/expert/admin
  category    text,
  content     text NOT NULL,
  status      inquiry_status NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.15 PROVIDER (전문서비스 제공기관 — 신규) ─────────────
CREATE TABLE provider (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  logo       text,
  type       provider_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.16 SERVICE_ORDER (전문서비스 주문) ───────────────────
CREATE TABLE service_order (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id        uuid REFERENCES owner(id) ON DELETE CASCADE,       -- client_id → owner_id
  expert_id       uuid REFERENCES expert(id) ON DELETE CASCADE,      -- partner_id → expert_id
  provider_id     uuid REFERENCES provider(id),                      -- 신규: 제공기관 연결
  category        service_category NOT NULL,
  package_slug    text NOT NULL,
  package_name    text NOT NULL,
  price           int NOT NULL,
  is_free         boolean NOT NULL DEFAULT false,                    -- 신규: 무료/유료 구분
  status          order_status NOT NULL DEFAULT 'pending',
  detail          text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_one_orderer CHECK (
    (owner_id IS NOT NULL AND expert_id IS NULL) OR
    (owner_id IS NULL AND expert_id IS NOT NULL)
  )
);

-- ─── 3.17 EXPERT_INTEREST (관심표현 — 기존 partner_interest) ─
CREATE TABLE expert_interest (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id  uuid NOT NULL REFERENCES request(id) ON DELETE CASCADE,
  expert_id   uuid NOT NULL REFERENCES expert(id) ON DELETE CASCADE,  -- partner_id → expert_id
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(request_id, expert_id)
);

-- ─── 3.18 DEAL_MESSAGE (거래 메시지) ────────────────────────
CREATE TABLE deal_message (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id     uuid NOT NULL REFERENCES deal(id) ON DELETE CASCADE,
  sender_type text NOT NULL CHECK (sender_type IN ('expert', 'admin', 'owner')),  -- 용어 통일
  sender_id   uuid NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.19 MATCHING_CANDIDATE (AI 후보 — 보조 유지) ──────────
CREATE TABLE matching_candidate (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      uuid NOT NULL REFERENCES request(id) ON DELETE CASCADE,
  expert_id       uuid NOT NULL REFERENCES expert(id),                -- partner_id → expert_id
  rank            smallint NOT NULL,
  score           numeric(6,2) NOT NULL DEFAULT 0,
  score_detail    jsonb,
  status          text NOT NULL DEFAULT 'pending',
  auto_assign_at  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.20 EXPERT_ACTIVITY (활동 가점 — 신규) ────────────────
CREATE TABLE expert_activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id   uuid NOT NULL REFERENCES expert(id) ON DELETE CASCADE,
  type        expert_activity_type NOT NULL,
  points      numeric(4,1) NOT NULL DEFAULT 0,
  approved_by admin_name,
  created_at  timestamptz NOT NULL DEFAULT now(),
  expires_at  timestamptz                                             -- 최근 3개월 유효
);

-- ─── 3.21 DISPUTE (이의제기 — 신규) ────────────────────────
CREATE TABLE dispute (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type dispute_target_type NOT NULL,
  target_id   uuid NOT NULL,
  raised_by   review_author NOT NULL,                                 -- owner/expert
  reason      text NOT NULL,
  status      dispute_status NOT NULL DEFAULT 'open',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── 3.22 PLATFORM_CONFIG (설정값 — 신규) ───────────────────
CREATE TABLE platform_config (
  key         text PRIMARY KEY,
  value       jsonb NOT NULL,
  description text,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. 트리거 (updated_at 자동 갱신)
-- ============================================================

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'owner', 'expert', 'request', 'deal', 'matching', 'settlement',
    'review', 'inquiry', 'deal_workflow', 'service_order',
    'guarantee_fund_ledger', 'matching_candidate', 'review_ai_suggestion',
    'invitation', 'dispute', 'provider', 'platform_config'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t
    );
  END LOOP;
END $$;

-- ============================================================
-- 5. 인덱스
-- ============================================================

-- owner
CREATE INDEX idx_owner_status ON owner(status);

-- expert
CREATE INDEX idx_expert_status ON expert(status);
CREATE INDEX idx_expert_grade ON expert(grade);
CREATE INDEX idx_expert_total_score ON expert(total_score DESC);

-- category
CREATE INDEX idx_category_parent ON category(parent_id);
CREATE INDEX idx_category_depth ON category(depth);

-- expert_category
CREATE INDEX idx_ec_expert ON expert_category(expert_id);
CREATE INDEX idx_ec_category ON expert_category(category_id);

-- request
CREATE INDEX idx_request_owner ON request(owner_id);
CREATE INDEX idx_request_status ON request(status);
CREATE INDEX idx_request_status_created ON request(status, created_at DESC);
CREATE INDEX idx_request_category ON request(category_id);

-- matching
CREATE INDEX idx_matching_request ON matching(request_id);
CREATE INDEX idx_matching_expert ON matching(expert_id);

-- deal
CREATE INDEX idx_deal_request ON deal(request_id);
CREATE INDEX idx_deal_expert ON deal(expert_id);
CREATE INDEX idx_deal_status ON deal(status);
CREATE INDEX idx_deal_status_created ON deal(status, created_at DESC);
CREATE INDEX idx_deal_invitation ON deal(invitation_id);

-- invitation
CREATE INDEX idx_invitation_owner ON invitation(owner_id);
CREATE INDEX idx_invitation_expert ON invitation(expert_id);
CREATE INDEX idx_invitation_request ON invitation(request_id);
CREATE INDEX idx_invitation_status ON invitation(status);

-- settlement
CREATE INDEX idx_settlement_deal ON settlement(deal_id);

-- guarantee_fund_ledger
CREATE INDEX idx_guarantee_ledger_type ON guarantee_fund_ledger(entry_type);
CREATE INDEX idx_guarantee_ledger_created ON guarantee_fund_ledger(created_at);
CREATE INDEX idx_guarantee_type_created ON guarantee_fund_ledger(entry_type, created_at DESC);

-- deal_workflow
CREATE INDEX idx_workflow_deal ON deal_workflow(deal_id);

-- review
CREATE INDEX idx_review_deal ON review(deal_id);
CREATE INDEX idx_review_author ON review(author_type);
CREATE INDEX idx_review_deal_author ON review(deal_id, author_type);

-- review_ai_suggestion
CREATE INDEX idx_ras_deal ON review_ai_suggestion(deal_id);

-- inquiry
CREATE INDEX idx_inquiry_status ON inquiry(status);

-- service_order
CREATE INDEX idx_service_order_owner ON service_order(owner_id);
CREATE INDEX idx_service_order_expert ON service_order(expert_id);
CREATE INDEX idx_service_order_provider ON service_order(provider_id);
CREATE INDEX idx_service_order_status ON service_order(status);

-- expert_interest
CREATE INDEX idx_interest_request ON expert_interest(request_id);
CREATE INDEX idx_interest_expert ON expert_interest(expert_id);
CREATE INDEX idx_interest_request_created ON expert_interest(request_id, created_at DESC);

-- deal_message
CREATE INDEX idx_deal_message_deal ON deal_message(deal_id);
CREATE INDEX idx_deal_message_created ON deal_message(deal_id, created_at);

-- matching_candidate
CREATE INDEX idx_mc_request ON matching_candidate(request_id);
CREATE INDEX idx_mc_status ON matching_candidate(status);
CREATE INDEX idx_candidate_request_rank ON matching_candidate(request_id, rank);

-- expert_activity
CREATE INDEX idx_ea_expert ON expert_activity(expert_id);
CREATE INDEX idx_ea_expires ON expert_activity(expires_at);

-- dispute
CREATE INDEX idx_dispute_target ON dispute(target_type, target_id);
CREATE INDEX idx_dispute_status ON dispute(status);

-- ============================================================
-- 6. RLS (Row Level Security)
-- ============================================================

-- 모든 테이블 RLS 활성화
ALTER TABLE owner                ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert               ENABLE ROW LEVEL SECURITY;
ALTER TABLE category             ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_category      ENABLE ROW LEVEL SECURITY;
ALTER TABLE request              ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching             ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation           ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement           ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantee_fund_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_workflow        ENABLE ROW LEVEL SECURITY;
ALTER TABLE review               ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_ai_suggestion ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiry              ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider             ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_order        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_interest      ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_message         ENABLE ROW LEVEL SECURITY;
ALTER TABLE matching_candidate   ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_activity      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute              ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_config      ENABLE ROW LEVEL SECURITY;

-- ─── 6.1 OWNER 정책 ────────────────────────────────────────

-- 본인 프로필
CREATE POLICY owner_select_own ON owner FOR SELECT
  USING (auth_user_id = auth.uid());

-- 본인 의뢰
CREATE POLICY owner_select_own_request ON request FOR SELECT
  USING (owner_id IN (SELECT id FROM owner WHERE auth_user_id = auth.uid()));
CREATE POLICY owner_insert_request ON request FOR INSERT
  WITH CHECK (owner_id IN (SELECT id FROM owner WHERE auth_user_id = auth.uid()));

-- 본인 의뢰 연결 deal
CREATE POLICY owner_select_own_deal ON deal FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM request WHERE owner_id IN (
        SELECT id FROM owner WHERE auth_user_id = auth.uid()
      )
    )
    OR invitation_id IN (
      SELECT id FROM invitation WHERE owner_id IN (
        SELECT id FROM owner WHERE auth_user_id = auth.uid()
      )
    )
  );

-- 본인 deal settlement
CREATE POLICY owner_select_own_settlement ON settlement FOR SELECT
  USING (deal_id IN (
    SELECT id FROM deal WHERE request_id IN (
      SELECT id FROM request WHERE owner_id IN (
        SELECT id FROM owner WHERE auth_user_id = auth.uid()
      )
    )
    OR deal_id IN (
      SELECT d.id FROM deal d
      JOIN invitation i ON d.invitation_id = i.id
      WHERE i.owner_id IN (SELECT id FROM owner WHERE auth_user_id = auth.uid())
    )
  ));

-- 본인 deal workflow
CREATE POLICY owner_select_deal_workflow ON deal_workflow FOR SELECT
  USING (deal_id IN (
    SELECT id FROM deal WHERE request_id IN (
      SELECT id FROM request WHERE owner_id IN (
        SELECT id FROM owner WHERE auth_user_id = auth.uid()
      )
    )
  ));

-- 본인 deal 메시지 읽기
CREATE POLICY owner_select_deal_messages ON deal_message FOR SELECT
  USING (deal_id IN (
    SELECT d.id FROM deal d
    JOIN request r ON d.request_id = r.id
    JOIN owner o ON r.owner_id = o.id
    WHERE o.auth_user_id = auth.uid()
  ));

-- 본인 deal 메시지 보내기
CREATE POLICY owner_send_message ON deal_message FOR INSERT
  WITH CHECK (
    sender_type = 'owner' AND
    deal_id IN (
      SELECT d.id FROM deal d
      JOIN request r ON d.request_id = r.id
      JOIN owner o ON r.owner_id = o.id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- 본인 초빙
CREATE POLICY owner_select_own_invitation ON invitation FOR SELECT
  USING (owner_id IN (SELECT id FROM owner WHERE auth_user_id = auth.uid()));
CREATE POLICY owner_insert_invitation ON invitation FOR INSERT
  WITH CHECK (owner_id IN (SELECT id FROM owner WHERE auth_user_id = auth.uid()));

-- 본인 서비스 주문
CREATE POLICY owner_select_service_order ON service_order FOR SELECT
  USING (owner_id IN (SELECT id FROM owner WHERE auth_user_id = auth.uid()));
CREATE POLICY owner_insert_service_order ON service_order FOR INSERT
  WITH CHECK (owner_id IN (SELECT id FROM owner WHERE auth_user_id = auth.uid()));

-- ─── 6.2 EXPERT 정책 ───────────────────────────────────────

-- 본인 프로필
CREATE POLICY expert_select_own ON expert FOR SELECT
  USING (auth_user_id = auth.uid());
CREATE POLICY expert_update_own ON expert FOR UPDATE
  USING (auth_user_id = auth.uid());

-- 매칭 조회
CREATE POLICY expert_select_matching ON matching FOR SELECT
  USING (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));

-- 본인 deal 조회
CREATE POLICY expert_select_own_deal ON deal FOR SELECT
  USING (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));

-- 본인 워크플로우
CREATE POLICY expert_select_own_workflow ON deal_workflow FOR SELECT
  USING (deal_id IN (
    SELECT id FROM deal WHERE expert_id IN (
      SELECT id FROM expert WHERE auth_user_id = auth.uid()
    )
  ));
CREATE POLICY expert_update_own_workflow ON deal_workflow FOR UPDATE
  USING (deal_id IN (
    SELECT id FROM deal WHERE expert_id IN (
      SELECT id FROM expert WHERE auth_user_id = auth.uid()
    )
  ));

-- 본인 정산
CREATE POLICY expert_select_own_settlement ON settlement FOR SELECT
  USING (deal_id IN (
    SELECT id FROM deal WHERE expert_id IN (
      SELECT id FROM expert WHERE auth_user_id = auth.uid()
    )
  ));

-- 본인 초빙 수신
CREATE POLICY expert_select_own_invitation ON invitation FOR SELECT
  USING (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));

-- 관심 표현
CREATE POLICY expert_select_interest ON expert_interest FOR SELECT
  USING (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));
CREATE POLICY expert_insert_interest ON expert_interest FOR INSERT
  WITH CHECK (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));
CREATE POLICY expert_delete_interest ON expert_interest FOR DELETE
  USING (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));

-- 거래 메시지
CREATE POLICY expert_select_deal_messages ON deal_message FOR SELECT
  USING (deal_id IN (
    SELECT id FROM deal WHERE expert_id IN (
      SELECT id FROM expert WHERE auth_user_id = auth.uid()
    )
  ));
CREATE POLICY expert_insert_deal_message ON deal_message FOR INSERT
  WITH CHECK (
    sender_type = 'expert' AND
    sender_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()) AND
    deal_id IN (SELECT id FROM deal WHERE expert_id = sender_id)
  );

-- 서비스 주문
CREATE POLICY expert_select_service_order ON service_order FOR SELECT
  USING (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));
CREATE POLICY expert_insert_service_order ON service_order FOR INSERT
  WITH CHECK (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));

-- ─── 6.3 공통 정책 (누구나 읽기 가능) ──────────────────────

-- 카테고리: 누구나 조회
CREATE POLICY category_select_all ON category FOR SELECT USING (true);

-- expert_category: 본인 것 관리
CREATE POLICY ec_select_own ON expert_category FOR SELECT
  USING (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));
CREATE POLICY ec_insert_own ON expert_category FOR INSERT
  WITH CHECK (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));
CREATE POLICY ec_delete_own ON expert_category FOR DELETE
  USING (expert_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()));

-- 제공기관: 누구나 조회
CREATE POLICY provider_select_all ON provider FOR SELECT USING (true);

-- 매칭 후보: 누구나 조회 (관리자 대시보드용)
CREATE POLICY mc_select_all ON matching_candidate FOR SELECT USING (true);

-- AI 평가 제안: 누구나 조회 (관리자 검수용)
CREATE POLICY ras_select_all ON review_ai_suggestion FOR SELECT USING (true);

-- 설정: 누구나 조회
CREATE POLICY config_select_all ON platform_config FOR SELECT USING (true);

-- 문의: 본인 생성
CREATE POLICY inquiry_insert ON inquiry FOR INSERT
  WITH CHECK (author_id IS NOT NULL);

-- 보증금 원장: admin만 접근 (RLS만 활성, 정책 없음 → service_role만)

-- ============================================================
-- 7. 설정 초기값 (하드코딩 금지용)
-- ============================================================

INSERT INTO platform_config (key, value, description) VALUES
  ('max_active_interests',  '5',    '전문가 동시 관심표현 최대 수'),
  ('max_active_invitations', '5',   '전문가 동시 초빙(invited 상태) 최대 수'),
  ('newbie_review_threshold', '3',  '신규자 판정 리뷰 건수 기준'),
  ('audit_sample_rate',      '0.05', '무작위 감사 추출 비율 (5%)'),
  ('default_hourly_rate',    '25000', '기본 시간당 단가');
