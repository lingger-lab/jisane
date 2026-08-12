-- ============================================================
-- 0032: 구독 전환 Phase 0 — 기존 테이블 additive 변경 + config 시드
-- (docs/16 §2.3: deal / settlement / service_package / dispute / platform_config)
-- ============================================================
-- additive-only: 컬럼 추가 + 명시적 백필만. DROP/타입변경/의미 파괴 없음.
-- 기존 테이블은 이미 RLS enabled + 정책 보유(0019) — 신규 컬럼은 기존 정책을 따른다.
--   (settlement 신규 금액 컬럼 중 pg_fee_amt·risk_reserve_amt는 본인 SELECT 정책으로
--    행이 노출되나, UI 비표시는 표시층(§8.2 settlements API)에서 처리 — §1.1 참조)
-- ============================================================

-- ─── 1. DEAL: pricing_model (grandfather 단일 판별 컬럼) ────
-- ★DEFAULT는 legacy('match_fee_v1')로 둔다 — §11.9 "pricing_model 기본값은 영구
--   legacy(신코드가 항상 명시 'subscription_v2')". §2.2 스케치의 DEFAULT
--   'subscription_v2'를 따르면 Phase 0 배포~거래생성 코드 전환(Phase 3) 사이에
--   생성되는 거래가 v1 산식인데 v2로 오분류되는 창이 생긴다(치명 §11.1).
--   기존 행 백필('match_fee_v1')은 DEFAULT 채움으로 자동 충족.
ALTER TABLE deal ADD COLUMN IF NOT EXISTS pricing_model text NOT NULL DEFAULT 'match_fee_v1';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_deal_pricing_model') THEN
    ALTER TABLE deal ADD CONSTRAINT chk_deal_pricing_model
      CHECK (pricing_model IN ('match_fee_v1', 'subscription_v2'));
  END IF;
END $$;

-- ─── 2. SETTLEMENT: v2 4분해 금액 + 크레딧 보류 상태 ────────
-- 불변식(§1.1): total_pay = expert_payout_amt + pg_fee_amt + risk_reserve_amt + credit_hold_amt
-- (교차 테이블이라 DB CHECK 불가 — calcDealPricing property 테스트로 검증, §11.2)
ALTER TABLE settlement
  ADD COLUMN IF NOT EXISTS expert_payout_amt     int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pg_fee_amt            int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_reserve_amt      int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_hold_amt       int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_state          credit_state NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS credit_release_due_at timestamptz;
-- 기존 행 = legacy 거래: 4필드 0 + credit_state 'none'이 정확한 의미라 별도 백필 불필요.
-- (환불 경합 §9-④: refunded settlement도 'none' 유지)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_settlement_v2_amts_nonneg') THEN
    ALTER TABLE settlement ADD CONSTRAINT chk_settlement_v2_amts_nonneg CHECK (
      expert_payout_amt >= 0 AND pg_fee_amt >= 0
      AND risk_reserve_amt >= 0 AND credit_hold_amt >= 0
    );
  END IF;
END $$;

-- 크레딧 유실 방지(적대검증 F4): holding인데 만기 due_at가 NULL이면 cron이 영원히
-- 못 잡아 보류분이 영구 미해제된다. holding은 반드시 due_at를 갖도록 강제.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_settlement_credit_hold_due') THEN
    ALTER TABLE settlement ADD CONSTRAINT chk_settlement_credit_hold_due CHECK (
      credit_state <> 'holding' OR credit_release_due_at IS NOT NULL
    );
  END IF;
END $$;

-- credit-hold-release cron: 보류창 만기 도래분 스캔 (§5.1)
CREATE INDEX IF NOT EXISTS idx_settlement_credit_release_due
  ON settlement (credit_release_due_at) WHERE credit_state = 'holding';

-- ─── 3. DISPUTE: 분쟁 상태기계 중간단계 (§7.1 — enum 아닌 timestamp/text) ─
ALTER TABLE dispute
  ADD COLUMN IF NOT EXISTS resolution        text,
  ADD COLUMN IF NOT EXISTS admin_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS owner_agreed_at   timestamptz,
  ADD COLUMN IF NOT EXISTS expert_agreed_at  timestamptz,
  ADD COLUMN IF NOT EXISTS executed_at       timestamptz;

-- ─── 4. SERVICE_PACKAGE: 3티어 접근 + 체험범위 (§4.1) ───────
-- 컬럼 추가와 is_free→'free' 백필을 원자로 묶는다(재실행 시 백필 반복 방지).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'service_package'
      AND column_name = 'access_type'
  ) THEN
    ALTER TABLE service_package
      ADD COLUMN access_type service_access_type NOT NULL DEFAULT 'paid';
    -- 명시적 백필: 기존 무료 패키지 → 'free' (유료는 DEFAULT 'paid' 그대로,
    -- 'subscription' 티어 지정은 운영에서 패키지별 결정)
    UPDATE service_package SET access_type = 'free' WHERE is_free = true;
  END IF;
END $$;

ALTER TABLE service_package
  ADD COLUMN IF NOT EXISTS trial_scope jsonb;   -- provider가 정하는 체험범위(§4.1)

-- ─── 5. PLATFORM_CONFIG: 요율·기간 시드 (§2.3) ──────────────
-- 스키마(0019): key text PK · value jsonb · description text.
-- ON CONFLICT DO NOTHING: 재실행/운영 튜닝값 보존. 값 변경은 관리자 경로로만.
-- 주의: config_select_all(0019)로 공개 조회 가능 — 비밀 아님(요율은 공개 정보).
-- referral_reward_* 는 금액 미확정(§10-5)이라 시드하지 않음 — 확정 후 별도 마이그레이션.
INSERT INTO platform_config (key, value, description) VALUES
  ('work_price_markup',          '0.05',    '작업가격 마크업(기업부담 크레딧 보류분) = round(W×0.05)'),
  ('expert_pg_fee',              '0.035',   '시니어 지급 공제: 결제수수료 충당 = round(W×0.035), UI 비표시'),
  ('expert_risk_reserve',        '0.01',    '시니어 지급 공제: 위험적립 = round(W×0.01), UI 비표시'),
  ('credit_hold_days',           '30',      '거래 5% 크레딧 보류 기간(일) — released_at 기준'),
  ('credit_expiry_months',       '6',       '크레딧 유효기간(개월) — 적립일 기준'),
  ('credit_expiry_notice_days',  '[30, 7]', '크레딧 만료 사전통지 시점(D-일)'),
  ('billing_retry_days',         '[1, 3, 7]', '구독 청구 실패 재시도 간격(D+일)'),
  ('subscription_expire_after_days', '30',  '최종 청구실패 후 구독 expired 전환까지 유예(일)'),
  ('commission_rate',            '0.20',    '파트너 유료 매출 커미션율(월별 invoice)')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 롤백 노트 (역순):
--   DELETE FROM platform_config WHERE key IN ('work_price_markup','expert_pg_fee',
--     'expert_risk_reserve','credit_hold_days','credit_expiry_months',
--     'credit_expiry_notice_days','billing_retry_days',
--     'subscription_expire_after_days','commission_rate');
--   ALTER TABLE service_package DROP COLUMN IF EXISTS trial_scope,
--     DROP COLUMN IF EXISTS access_type;
--   ALTER TABLE dispute DROP COLUMN IF EXISTS executed_at, DROP COLUMN IF EXISTS
--     expert_agreed_at, DROP COLUMN IF EXISTS owner_agreed_at,
--     DROP COLUMN IF EXISTS admin_notified_at, DROP COLUMN IF EXISTS resolution;
--   DROP INDEX IF EXISTS idx_settlement_credit_release_due;
--   ALTER TABLE settlement DROP CONSTRAINT IF EXISTS chk_settlement_v2_amts_nonneg;
--   ALTER TABLE settlement DROP COLUMN IF EXISTS credit_release_due_at,
--     DROP COLUMN IF EXISTS credit_state, DROP COLUMN IF EXISTS credit_hold_amt,
--     DROP COLUMN IF EXISTS risk_reserve_amt, DROP COLUMN IF EXISTS pg_fee_amt,
--     DROP COLUMN IF EXISTS expert_payout_amt;
--   ALTER TABLE deal DROP CONSTRAINT IF EXISTS chk_deal_pricing_model;
--   ALTER TABLE deal DROP COLUMN IF EXISTS pricing_model;
--   ※ v2 거래가 이미 기록된 뒤에는 금액 컬럼 DROP 금지(금전 기록 소실)
-- ============================================================
