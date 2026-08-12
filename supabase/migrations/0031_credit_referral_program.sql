-- ============================================================
-- 0031: 구독 전환 Phase 0 — 크레딧 원장·추천·도구 실행 (docs/16 §2.2·§2.4)
-- referral / program_run / credit_ledger + owner·expert referral_code
-- ============================================================
-- ★0029 기본권한 함정: 신규 테이블은 생성한 같은 파일에서 즉시
--   ENABLE ROW LEVEL SECURITY (무정책 = deny). 본인 SELECT 정책만 부여,
--   write는 서버 adminClient(service_role) 전용 (§11.3).
-- 순서: referral(FK 보류) → program_run → credit_ledger → referral FK 후결합
--   (referral.reward_ledger_id ↔ credit_ledger.referral_id 순환 참조라
--    0019의 deal.invitation_id 후결합 패턴을 따른다)
-- additive-only · 멱등.
-- ============================================================

-- ─── 1. REFERRAL (추천) ─────────────────────────────────────
-- referrer/referee_id는 owner.id 또는 expert.id (다형 — DB FK 없음, 서버 검증)
CREATE TABLE IF NOT EXISTS referral (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code             text NOT NULL,             -- 가입 시 사용된 추천코드 스냅샷
  referrer_type    subscriber_type NOT NULL,
  referrer_id      uuid NOT NULL,
  referee_type     subscriber_type NOT NULL,
  referee_id       uuid NOT NULL,
  status           referral_status NOT NULL DEFAULT 'pending',
  qualified_at     timestamptz,
  rewarded_at      timestamptz,
  reward_ledger_id uuid,                      -- FK는 credit_ledger 생성 후 부착(아래 4절)
  rejected_reason  text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  -- 어뷰징 가드 (§6): 피추천인은 평생 1회만
  CONSTRAINT uq_referral_referee UNIQUE (referee_type, referee_id),
  -- 자기추천 구조 차단(동일 인물 동일 롤). 교차 롤·이메일 대조는 서버 검증(§6)
  CONSTRAINT chk_referral_not_self CHECK (
    NOT (referrer_type = referee_type AND referrer_id = referee_id)
  )
);

CREATE INDEX IF NOT EXISTS idx_referral_referrer ON referral (referrer_type, referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_status   ON referral (status);

ALTER TABLE referral ENABLE ROW LEVEL SECURITY;

-- 본인(추천인 또는 피추천인) SELECT만
DROP POLICY IF EXISTS referral_select_own ON referral;
CREATE POLICY referral_select_own ON referral FOR SELECT USING (
  (referrer_type = 'owner'  AND referrer_id IN (SELECT id FROM owner  WHERE auth_user_id = auth.uid())) OR
  (referrer_type = 'expert' AND referrer_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid())) OR
  (referee_type  = 'owner'  AND referee_id  IN (SELECT id FROM owner  WHERE auth_user_id = auth.uid())) OR
  (referee_type  = 'expert' AND referee_id  IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()))
);

DROP TRIGGER IF EXISTS trg_referral_updated ON referral;
CREATE TRIGGER trg_referral_updated BEFORE UPDATE ON referral
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- owner/expert 추천코드 (§2.2: referral_code text UNIQUE — 발급은 서버, base32)
ALTER TABLE owner  ADD COLUMN IF NOT EXISTS referral_code text;
ALTER TABLE expert ADD COLUMN IF NOT EXISTS referral_code text;
CREATE UNIQUE INDEX IF NOT EXISTS uq_owner_referral_code  ON owner  (referral_code);
CREATE UNIQUE INDEX IF NOT EXISTS uq_expert_referral_code ON expert (referral_code);

-- ─── 2. PROGRAM_RUN (도구 실행 usage — §4.1 모든 실행 1행) ──
CREATE TABLE IF NOT EXISTS program_run (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_package_id uuid NOT NULL REFERENCES service_package(id),
  runner_type        subscriber_type NOT NULL,
  runner_id          uuid NOT NULL,             -- owner.id | expert.id (다형)
  access_mode        program_access_mode NOT NULL,
  service_order_id   uuid REFERENCES service_order(id),
  billed_amount      int NOT NULL DEFAULT 0 CHECK (billed_amount >= 0),
  status             program_run_status NOT NULL DEFAULT 'started',
  result_url         text,
  started_at         timestamptz NOT NULL DEFAULT now(),
  completed_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- §2.2 지정 인덱스: (package, 시각) / (runner, package, 시각)
CREATE INDEX IF NOT EXISTS idx_program_run_package
  ON program_run (service_package_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_run_runner
  ON program_run (runner_type, runner_id, service_package_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_run_order
  ON program_run (service_order_id);

ALTER TABLE program_run ENABLE ROW LEVEL SECURITY;

-- 본인 SELECT만
DROP POLICY IF EXISTS program_run_select_own ON program_run;
CREATE POLICY program_run_select_own ON program_run FOR SELECT USING (
  (runner_type = 'owner'  AND runner_id IN (SELECT id FROM owner  WHERE auth_user_id = auth.uid())) OR
  (runner_type = 'expert' AND runner_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()))
);

DROP TRIGGER IF EXISTS trg_program_run_updated ON program_run;
CREATE TRIGGER trg_program_run_updated BEFORE UPDATE ON program_run
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 3. CREDIT_LEDGER (크레딧 원장 — append-only 화폐 원장) ─
CREATE TABLE IF NOT EXISTS credit_ledger (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_type      credit_holder_type NOT NULL,
  holder_id        uuid NOT NULL,               -- owner.id | expert.id (다형)
  entry_type       credit_entry_type NOT NULL,
  amount           int NOT NULL,                -- 적립 +, 차감/상쇄 −
  balance_after    int,                         -- 서버 기입(참고 캐시 — 진실은 SUM, §11.5)
  expires_at       timestamptz,                 -- earn lot 만료(적립+6개월)
  remaining        int,                         -- earn lot FIFO 잔여 (유일한 가변 필드)
  settlement_id    uuid REFERENCES settlement(id),
  referral_id      uuid REFERENCES referral(id),
  service_order_id uuid REFERENCES service_order(id),
  program_run_id   uuid REFERENCES program_run(id),
  source_entry_id  uuid REFERENCES credit_ledger(id),  -- expire/revoke가 상쇄한 earn 행
  note             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  -- 금전 방향 불변식: earn은 양수, spend/expire/revoke는 음수
  CONSTRAINT chk_credit_amount_sign CHECK (
    (entry_type IN ('earn_deal_hold', 'earn_referral') AND amount > 0) OR
    (entry_type IN ('spend', 'expire', 'revoke') AND amount < 0) OR
    (entry_type = 'adjust' AND amount <> 0)
  ),
  -- earn lot은 만료·잔여 필수 (§2.2)
  CONSTRAINT chk_credit_earn_lot CHECK (
    entry_type NOT IN ('earn_deal_hold', 'earn_referral')
    OR (expires_at IS NOT NULL AND remaining IS NOT NULL)
  ),
  -- remaining은 0 ≤ remaining ≤ amount (설정 시 amount 양수 강제)
  CONSTRAINT chk_credit_remaining_range CHECK (
    remaining IS NULL OR (remaining >= 0 AND remaining <= amount)
  ),
  -- ★구조적 차단 (§5.2): spend는 플랫폼 유료 상품(service_order|program_run)만.
  --   구독 invoice 참조 컬럼 자체가 없어 구독료 크레딧 결제는 불가능.
  CONSTRAINT chk_credit_spend_link CHECK (
    entry_type <> 'spend'
    OR (service_order_id IS NOT NULL OR program_run_id IS NOT NULL)
  ),
  -- ★멱등키 NULL 우회 차단(적대검증 F1): earn 행에 소스 FK 강제. UNIQUE 인덱스는
  --   NULL을 distinct로 보므로 settlement_id/referral_id가 NULL이면 이중적립을 못 막는다.
  CONSTRAINT chk_credit_earn_source CHECK (
    (entry_type <> 'earn_deal_hold' OR settlement_id IS NOT NULL)
    AND (entry_type <> 'earn_referral' OR referral_id IS NOT NULL)
  )
);

-- ★이중 적립 방지 (§11.5): settlement당 earn_deal_hold 1행 (23505 = 정상 멱등)
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_earn_deal_hold
  ON credit_ledger (settlement_id) WHERE entry_type = 'earn_deal_hold';
-- 추천 보상도 referral당 1행
CREATE UNIQUE INDEX IF NOT EXISTS uq_credit_earn_referral
  ON credit_ledger (referral_id) WHERE entry_type = 'earn_referral';

CREATE INDEX IF NOT EXISTS idx_credit_holder
  ON credit_ledger (holder_type, holder_id, created_at);
-- FIFO 차감·만료 cron: 살아있는 lot 스캔 (§5.2·§5.3)
CREATE INDEX IF NOT EXISTS idx_credit_live_lots
  ON credit_ledger (holder_type, holder_id, created_at, id) WHERE remaining > 0;
CREATE INDEX IF NOT EXISTS idx_credit_expiry
  ON credit_ledger (expires_at) WHERE remaining > 0;

ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;

-- 본인 SELECT만. write 정책 없음(적립·차감은 서버 RPC/adminClient — §5).
DROP POLICY IF EXISTS credit_ledger_select_own ON credit_ledger;
CREATE POLICY credit_ledger_select_own ON credit_ledger FOR SELECT USING (
  (holder_type = 'owner'  AND holder_id IN (SELECT id FROM owner  WHERE auth_user_id = auth.uid())) OR
  (holder_type = 'expert' AND holder_id IN (SELECT id FROM expert WHERE auth_user_id = auth.uid()))
);

-- append-only 강제: DELETE 금지, UPDATE는 remaining·note만 허용 (§5.3 행 삭제 금지)
CREATE OR REPLACE FUNCTION credit_ledger_append_only()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'credit_ledger는 append-only: 삭제 금지 — 상쇄(expire/revoke/adjust) 행으로 처리하세요';
  END IF;
  IF NEW.id               IS DISTINCT FROM OLD.id
     OR NEW.holder_type      IS DISTINCT FROM OLD.holder_type
     OR NEW.holder_id        IS DISTINCT FROM OLD.holder_id
     OR NEW.entry_type       IS DISTINCT FROM OLD.entry_type
     OR NEW.amount           IS DISTINCT FROM OLD.amount
     OR NEW.balance_after    IS DISTINCT FROM OLD.balance_after
     OR NEW.expires_at       IS DISTINCT FROM OLD.expires_at
     OR NEW.settlement_id    IS DISTINCT FROM OLD.settlement_id
     OR NEW.referral_id      IS DISTINCT FROM OLD.referral_id
     OR NEW.service_order_id IS DISTINCT FROM OLD.service_order_id
     OR NEW.program_run_id   IS DISTINCT FROM OLD.program_run_id
     OR NEW.source_entry_id  IS DISTINCT FROM OLD.source_entry_id
     OR NEW.created_at       IS DISTINCT FROM OLD.created_at
  THEN
    RAISE EXCEPTION 'credit_ledger는 append-only: remaining·note 외 컬럼은 불변입니다';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 0029가 신규 함수에 EXECUTE를 자동 부여하므로 회수 (트리거 발화에는 불필요)
REVOKE EXECUTE ON FUNCTION credit_ledger_append_only() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_credit_ledger_append_only ON credit_ledger;
CREATE TRIGGER trg_credit_ledger_append_only
  BEFORE UPDATE OR DELETE ON credit_ledger
  FOR EACH ROW EXECUTE FUNCTION credit_ledger_append_only();

-- ─── 4. referral.reward_ledger_id FK 후결합 (순환 참조 해소) ─
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_referral_reward_ledger'
  ) THEN
    ALTER TABLE referral ADD CONSTRAINT fk_referral_reward_ledger
      FOREIGN KEY (reward_ledger_id) REFERENCES credit_ledger(id);
  END IF;
END $$;

-- ============================================================
-- 롤백 노트 (역순):
--   ALTER TABLE referral DROP CONSTRAINT IF EXISTS fk_referral_reward_ledger;
--   DROP TRIGGER IF EXISTS trg_credit_ledger_append_only ON credit_ledger;
--   DROP FUNCTION IF EXISTS credit_ledger_append_only();
--   DROP TABLE IF EXISTS credit_ledger;
--   DROP TABLE IF EXISTS program_run;
--   DROP TABLE IF EXISTS referral;
--   DROP INDEX IF EXISTS uq_owner_referral_code;  DROP INDEX IF EXISTS uq_expert_referral_code;
--   ALTER TABLE owner  DROP COLUMN IF EXISTS referral_code;
--   ALTER TABLE expert DROP COLUMN IF EXISTS referral_code;
--   ※ 프로드에서 크레딧 발행 후에는 원장 DROP 금지 — 킬스위치는 신규 발행 중단(§11.9)
-- ============================================================
