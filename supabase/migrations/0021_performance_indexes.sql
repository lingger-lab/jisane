-- ============================================================
-- 0021: 성능 인덱스 + 스키마 정규화
-- PDCA-B: 누락 인덱스 추가, review.expert_id 비정규화,
--         matching_candidate.status enum, deal_message.sender_type enum,
--         RLS 정책 보완
-- ============================================================

-- ─── B-1: 누락 인덱스 6개 ────────────────────────────────────

-- 정산 상태별 조회 (autoReleaseSettlements, dashboard)
CREATE INDEX IF NOT EXISTS idx_settlement_escrow_status
  ON settlement(escrow_status);
CREATE INDEX IF NOT EXISTS idx_settlement_escrow_updated
  ON settlement(escrow_status, updated_at);

-- 매칭 후보 자동배정 (autoAssignOverdue)
CREATE INDEX IF NOT EXISTS idx_mc_auto_assign
  ON matching_candidate(status, rank, auto_assign_at);

-- 신규자 필터 (verify 게이트) — partial index
CREATE INDEX IF NOT EXISTS idx_expert_is_newbie
  ON expert(is_newbie) WHERE is_newbie = true;

-- 매칭 상태별 (dashboard)
CREATE INDEX IF NOT EXISTS idx_matching_status
  ON matching(status);

-- 의뢰 상태+타입 (browse, 맞춤 의뢰 필터)
CREATE INDEX IF NOT EXISTS idx_request_status_type
  ON request(status, req_type);


-- ─── B-2: review.expert_id 비정규화 ──────────────────────────

ALTER TABLE review ADD COLUMN IF NOT EXISTS
  expert_id uuid REFERENCES expert(id);

-- 기존 데이터 backfill (deal FK 경유)
UPDATE review r
SET expert_id = d.expert_id
FROM deal d
WHERE r.deal_id = d.id
  AND r.expert_id IS NULL;

-- 자동 동기화 트리거 (INSERT 시 deal에서 expert_id 복사)
CREATE OR REPLACE FUNCTION sync_review_expert_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expert_id IS NULL THEN
    NEW.expert_id := (SELECT expert_id FROM deal WHERE id = NEW.deal_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_review_expert_id ON review;
CREATE TRIGGER trg_review_expert_id
  BEFORE INSERT ON review
  FOR EACH ROW EXECUTE FUNCTION sync_review_expert_id();

CREATE INDEX IF NOT EXISTS idx_review_expert
  ON review(expert_id);


-- ─── B-3: matching_candidate.status text → enum ──────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'matching_candidate_status') THEN
    CREATE TYPE matching_candidate_status AS ENUM ('pending', 'selected', 'skipped');
  END IF;
END$$;

ALTER TABLE matching_candidate
  ALTER COLUMN status TYPE matching_candidate_status
  USING status::matching_candidate_status;


-- ─── B-4: deal_message.sender_type text → enum ──────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_sender_type') THEN
    CREATE TYPE message_sender_type AS ENUM ('owner', 'expert', 'admin');
  END IF;
END$$;

-- CHECK 제약 제거 (enum이 대체)
ALTER TABLE deal_message
  DROP CONSTRAINT IF EXISTS deal_message_sender_type_check;

ALTER TABLE deal_message
  ALTER COLUMN sender_type TYPE message_sender_type
  USING sender_type::message_sender_type;


-- ─── C-5: RLS 정책 추가 (expert_activity, dispute) ──────────

-- expert_activity: admin(service_role)만 write, 본인 조회
DO $$
BEGIN
  -- expert_activity SELECT
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expert_activity' AND policyname = 'expert_own_activity'
  ) THEN
    CREATE POLICY "expert_own_activity" ON expert_activity
      FOR SELECT USING (
        expert_id = auth.uid()
        OR (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
      );
  END IF;

  -- expert_activity ALL (admin)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expert_activity' AND policyname = 'admin_manage_activity'
  ) THEN
    CREATE POLICY "admin_manage_activity" ON expert_activity
      FOR ALL USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
      );
  END IF;

  -- dispute SELECT (관련 당사자 + admin)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dispute' AND policyname = 'dispute_raised_by_or_admin'
  ) THEN
    CREATE POLICY "dispute_raised_by_or_admin" ON dispute
      FOR SELECT USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
      );
  END IF;

  -- dispute ALL (admin)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'dispute' AND policyname = 'admin_manage_dispute'
  ) THEN
    CREATE POLICY "admin_manage_dispute" ON dispute
      FOR ALL USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role'
      );
  END IF;
END$$;
