-- ============================================================
-- 0030: 구독 전환 Phase 0 — 빌링 코어 (docs/16 §2.1·§2.2·§2.4)
-- 신규 enum 전부 + subscription_plan / billing_key / subscription / invoice
-- ============================================================
-- ★0029 기본권한 함정 (docs/16 §11.3): 0029_public_schema_grants의
--   ALTER DEFAULT PRIVILEGES가 이후 생성되는 모든 테이블에 anon/authenticated
--   DML을 자동 부여한다. 따라서 이 파일의 모든 신규 테이블은 생성 직후
--   같은 파일에서 ENABLE ROW LEVEL SECURITY (무정책 = deny).
--   - billing_key: 정책 0개 (service_role 전용 — 재청구 능력 유출 방지,
--     payment_key P3-92 상위호환). 벨트앤브레이스로 anon/authenticated REVOKE ALL.
--   - subscription/invoice: 본인 SELECT만 (0019 owner_select_own 패턴).
--     write 정책 없음 — 서버 adminClient(service_role)만 쓴다.
-- additive-only · 멱등(IF NOT EXISTS / ON CONFLICT / DROP+CREATE 정책·트리거).
-- ============================================================

-- ─── 1. 신규 enum (§2.1 전부 — 기존 enum 확장 없음, fresh-reset 함정 회피) ───
-- CREATE TYPE에는 IF NOT EXISTS가 없어 to_regtype 가드로 멱등화.
DO $$
BEGIN
  IF to_regtype('public.subscriber_type') IS NULL THEN
    CREATE TYPE subscriber_type AS ENUM ('owner', 'expert');
  END IF;
  IF to_regtype('public.subscription_status') IS NULL THEN
    CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'expired');
  END IF;
  IF to_regtype('public.billing_key_status') IS NULL THEN
    CREATE TYPE billing_key_status AS ENUM ('active', 'removed');
  END IF;
  IF to_regtype('public.invoice_type') IS NULL THEN
    CREATE TYPE invoice_type AS ENUM ('subscription', 'commission');
  END IF;
  IF to_regtype('public.invoice_status') IS NULL THEN
    CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'failed', 'void');
  END IF;
  IF to_regtype('public.credit_holder_type') IS NULL THEN
    CREATE TYPE credit_holder_type AS ENUM ('owner', 'expert');
  END IF;
  IF to_regtype('public.credit_entry_type') IS NULL THEN
    CREATE TYPE credit_entry_type AS ENUM
      ('earn_deal_hold', 'earn_referral', 'spend', 'expire', 'revoke', 'adjust');
  END IF;
  IF to_regtype('public.credit_state') IS NULL THEN
    -- settlement.credit_state용 (5% 보류분 상태)
    CREATE TYPE credit_state AS ENUM
      ('none', 'holding', 'released_to_credit', 'consumed_dispute');
  END IF;
  IF to_regtype('public.referral_status') IS NULL THEN
    CREATE TYPE referral_status AS ENUM ('pending', 'qualified', 'rewarded', 'rejected');
  END IF;
  IF to_regtype('public.service_access_type') IS NULL THEN
    CREATE TYPE service_access_type AS ENUM ('free', 'subscription', 'paid');
  END IF;
  IF to_regtype('public.program_run_status') IS NULL THEN
    CREATE TYPE program_run_status AS ENUM ('started', 'completed', 'failed');
  END IF;
  IF to_regtype('public.program_access_mode') IS NULL THEN
    CREATE TYPE program_access_mode AS ENUM ('free', 'trial', 'subscription', 'paid', 'credit');
  END IF;
END $$;

-- ─── 2. SUBSCRIPTION_PLAN (요금제 카탈로그) ─────────────────
CREATE TABLE IF NOT EXISTS subscription_plan (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE,
  audience      subscriber_type NOT NULL,
  name          text NOT NULL,
  -- 공급가(월, VAT 별도). VAT 가산은 calcVat 재사용(docs/16 §1.2)
  price_monthly int  NOT NULL CHECK (price_monthly >= 0),
  -- §2.1에 plan 상태 enum이 없어 text+CHECK로 격리 (보고서에 가정 명기)
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscription_plan ENABLE ROW LEVEL SECURITY;

-- 공개 카탈로그: active 요금제만 누구나 조회. write 정책 없음(서버 전용).
DROP POLICY IF EXISTS plan_select_active ON subscription_plan;
CREATE POLICY plan_select_active ON subscription_plan
  FOR SELECT USING (status = 'active');

DROP TRIGGER IF EXISTS trg_subscription_plan_updated ON subscription_plan;
CREATE TRIGGER trg_subscription_plan_updated BEFORE UPDATE ON subscription_plan
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 시드 (docs/16 §2.2): 기업 18,000 / 시니어 9,000 (공급가, VAT 별도)
-- 조회 키는 code(UNIQUE) — 고정 UUID를 쓰지 않아 기존 시드(0013/0020/0025)의
-- b/e/f 프리픽스 재사용 혼동을 피한다. 멱등: code 충돌 시 skip(운영 튜닝값 보존).
INSERT INTO subscription_plan (code, audience, name, price_monthly, status) VALUES
  ('owner_basic',  'owner',  '기업 기본',   18000, 'active'),
  ('expert_basic', 'expert', '시니어 기본',  9000, 'active')
ON CONFLICT (code) DO NOTHING;

-- ─── 3. BILLING_KEY (Toss 빌링키 — 재청구 크레덴셜) ─────────
-- subscriber_id는 owner.id 또는 expert.id (다형 참조 — DB FK 없음, 서버 검증)
CREATE TABLE IF NOT EXISTS billing_key (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_type    subscriber_type NOT NULL,
  subscriber_id      uuid NOT NULL,
  customer_key       text NOT NULL UNIQUE,   -- Toss customerKey
  toss_billing_key   text NOT NULL,          -- 발급된 billingKey (민감 — RLS 정책 0)
  card_company       text,                   -- 카드 마스킹 메타 (표시용)
  card_number_masked text,
  status             billing_key_status NOT NULL DEFAULT 'active',
  removed_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  -- 복합 FK 대상(적대검증 F3): subscription이 같은 구독자의 billing_key만 참조하도록.
  CONSTRAINT uq_billing_key_id_subscriber UNIQUE (id, subscriber_type, subscriber_id)
);

-- 구독자당 활성 빌링키 1개 (부분 UNIQUE)
CREATE UNIQUE INDEX IF NOT EXISTS uq_billing_key_active
  ON billing_key (subscriber_type, subscriber_id) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_billing_key_subscriber
  ON billing_key (subscriber_type, subscriber_id);

-- ★정책 0개 = 클라이언트 롤 전면 deny. SELECT 정책도 만들지 말 것(§11.7).
ALTER TABLE billing_key ENABLE ROW LEVEL SECURITY;
-- 벨트앤브레이스: 0029 기본 GRANT 자체를 회수 (service_role만 접근)
REVOKE ALL ON billing_key FROM anon, authenticated;

DROP TRIGGER IF EXISTS trg_billing_key_updated ON billing_key;
CREATE TRIGGER trg_billing_key_updated BEFORE UPDATE ON billing_key
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 4. SUBSCRIPTION (구독) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS subscription (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id              uuid NOT NULL REFERENCES subscription_plan(id),
  subscriber_type      subscriber_type NOT NULL,
  subscriber_id        uuid NOT NULL,                      -- owner.id | expert.id (다형)
  billing_key_id       uuid,   -- 복합 FK로 소유자 정합 강제(아래 fk_subscription_billing_key)
  status               subscription_status NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL,
  current_period_end   timestamptz NOT NULL,
  next_billing_at      timestamptz,
  past_due_since       timestamptz,
  fail_count           int NOT NULL DEFAULT 0 CHECK (fail_count >= 0),
  canceled_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_subscription_period CHECK (current_period_end > current_period_start),
  -- 교차소유 카드청구 차단(적대검증 F3): billing_key가 같은 구독자 소속이어야 함.
  -- billing_key_id NULL(가입 직후 등)이면 MATCH SIMPLE로 FK 미검사 → 허용.
  CONSTRAINT fk_subscription_billing_key
    FOREIGN KEY (billing_key_id, subscriber_type, subscriber_id)
    REFERENCES billing_key (id, subscriber_type, subscriber_id)
);

-- 구독자당 살아있는(active|past_due) 구독 1개 (부분 UNIQUE, §2.2)
CREATE UNIQUE INDEX IF NOT EXISTS uq_subscription_live
  ON subscription (subscriber_type, subscriber_id)
  WHERE status IN ('active', 'past_due');

CREATE INDEX IF NOT EXISTS idx_subscription_subscriber
  ON subscription (subscriber_type, subscriber_id);
-- billing-run cron: next_billing_at 도래분 스캔 (§3.3)
CREATE INDEX IF NOT EXISTS idx_subscription_next_billing
  ON subscription (next_billing_at)
  WHERE status IN ('active', 'past_due');

ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;

-- 본인 SELECT만. write 정책 없음(서버 adminClient 전용).
DROP POLICY IF EXISTS subscription_select_own ON subscription;
CREATE POLICY subscription_select_own ON subscription FOR SELECT USING (
  (subscriber_type = 'owner' AND subscriber_id IN
     (SELECT id FROM owner  WHERE auth_user_id = auth.uid()))
  OR
  (subscriber_type = 'expert' AND subscriber_id IN
     (SELECT id FROM expert WHERE auth_user_id = auth.uid()))
);

DROP TRIGGER IF EXISTS trg_subscription_updated ON subscription;
CREATE TRIGGER trg_subscription_updated BEFORE UPDATE ON subscription
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 5. INVOICE (구독 청구 + 파트너 커미션 겸용) ────────────
CREATE TABLE IF NOT EXISTS invoice (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_type          invoice_type NOT NULL,
  subscription_id       uuid REFERENCES subscription(id),
  provider_id           uuid REFERENCES provider(id),
  period_start          date NOT NULL,
  period_end            date NOT NULL,
  amount_supply         int NOT NULL CHECK (amount_supply >= 0),
  amount_vat            int NOT NULL CHECK (amount_vat >= 0),
  amount_total          int NOT NULL,
  status                invoice_status NOT NULL DEFAULT 'draft',
  order_id              text UNIQUE,        -- Toss orderId (§3.2 jisane_sub_… 스킴, 결정적 유도)
  payment_key           text,
  attempt_count         int NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_retry_at         timestamptz,
  paid_at               timestamptz,
  tax_invoice_issued_at timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  -- subscription XOR provider (§2.2)
  CONSTRAINT chk_invoice_target CHECK (
    (invoice_type = 'subscription' AND subscription_id IS NOT NULL AND provider_id IS NULL) OR
    (invoice_type = 'commission'   AND provider_id IS NOT NULL AND subscription_id IS NULL)
  ),
  CONSTRAINT chk_invoice_period CHECK (period_end >= period_start),
  -- 금전 불변식: 합계 = 공급가 + VAT
  CONSTRAINT chk_invoice_amount_sum CHECK (amount_total = amount_supply + amount_vat)
);

-- ★이중과금 방지 멱등키 (§11.4): 같은 구독·같은 기간 invoice는 1행만
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoice_subscription_period
  ON invoice (subscription_id, period_start) WHERE subscription_id IS NOT NULL;
-- 커미션도 동일: provider·기간당 1행 (§4.2 UNIQUE(provider,period))
CREATE UNIQUE INDEX IF NOT EXISTS uq_invoice_provider_period
  ON invoice (provider_id, period_start) WHERE provider_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoice_subscription ON invoice (subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoice_provider     ON invoice (provider_id);
-- dunning cron: 재시도 도래분 스캔 (§3.3)
CREATE INDEX IF NOT EXISTS idx_invoice_retry
  ON invoice (next_retry_at) WHERE status = 'failed';

ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;

-- 본인 SELECT만: 구독 invoice는 구독자 본인, 커미션 invoice는 provider 본인.
-- write 정책 없음(서버 adminClient 전용).
DROP POLICY IF EXISTS invoice_select_own ON invoice;
CREATE POLICY invoice_select_own ON invoice FOR SELECT USING (
  subscription_id IN (
    SELECT s.id FROM subscription s
    WHERE (s.subscriber_type = 'owner' AND s.subscriber_id IN
             (SELECT id FROM owner  WHERE auth_user_id = auth.uid()))
       OR (s.subscriber_type = 'expert' AND s.subscriber_id IN
             (SELECT id FROM expert WHERE auth_user_id = auth.uid()))
  )
  OR provider_id IN (SELECT id FROM provider WHERE auth_user_id = auth.uid())
);

DROP TRIGGER IF EXISTS trg_invoice_updated ON invoice;
CREATE TRIGGER trg_invoice_updated BEFORE UPDATE ON invoice
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 롤백 노트 (역순):
--   DROP TABLE IF EXISTS invoice;
--   DROP TABLE IF EXISTS subscription;
--   DROP TABLE IF EXISTS billing_key;
--   DROP TABLE IF EXISTS subscription_plan;
--   DROP TYPE IF EXISTS program_access_mode, program_run_status,
--     service_access_type, referral_status, credit_state, credit_entry_type,
--     credit_holder_type, invoice_status, invoice_type, billing_key_status,
--     subscription_status, subscriber_type;
--   (enum은 0031·0032가 이미 적용된 경우 해당 컬럼/테이블 롤백 후에만 DROP 가능)
-- ============================================================
