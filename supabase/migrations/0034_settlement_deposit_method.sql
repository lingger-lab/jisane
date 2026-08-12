-- 0034: settlement.deposit_method — 입금 경로 식별 (근시 무료 운영 docs/16 §0)
--
-- 온라인 결제(toss) vs 관리자 오프라인 에스크로(manual, 근시 무료 기간 작업비 중개).
-- 기존 행 = NULL = 레거시(식별 불요). 0029 기본권한 함정은 기존 테이블 컬럼 추가라 비해당.

ALTER TABLE settlement ADD COLUMN IF NOT EXISTS deposit_method text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_settlement_deposit_method') THEN
    ALTER TABLE settlement ADD CONSTRAINT chk_settlement_deposit_method
      CHECK (deposit_method IS NULL OR deposit_method IN ('toss', 'manual'));
  END IF;
END $$;

-- 롤백:
--   ALTER TABLE settlement DROP CONSTRAINT IF EXISTS chk_settlement_deposit_method;
--   ALTER TABLE settlement DROP COLUMN IF EXISTS deposit_method;
