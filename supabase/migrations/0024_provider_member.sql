-- ============================================================
-- 0024: provider 회원화 — 파트너공간(로그인하는 독립 회원, 관리자 승인제)
-- 파트너 = 전문서비스 제공 특수관계자 (기업 예: 엔터랩스, 또는 시니어전문가)
-- "파트너"는 UI 용어. DB 테이블명은 provider 유지 (옛 partner→expert 리네임 이력과 혼동 방지)
-- additive-only. 자세한 설계: docs/adr (파트너공간 마스터 플랜)
-- ============================================================

-- 신규 enum (ALTER TYPE ADD VALUE의 동일 트랜잭션 제약을 피해 CREATE TYPE 사용)
CREATE TYPE provider_status AS ENUM ('pending', 'active', 'rejected', 'suspended');
CREATE TYPE provider_kind   AS ENUM ('company', 'senior');

ALTER TABLE provider
  -- 카탈로그(service_package)·주문(service_order)의 FK 부모이므로 계정 삭제 시 연쇄 삭제 금지
  ADD COLUMN auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN provider     auth_provider,
  ADD COLUMN email        text,
  ADD COLUMN contact      text,
  ADD COLUMN description  text,
  ADD COLUMN website      text,
  ADD COLUMN kind         provider_kind   NOT NULL DEFAULT 'company',
  ADD COLUMN status       provider_status NOT NULL DEFAULT 'pending';

-- 기존 엔터랩스 시드는 즉시 활성 (계정 미연결 active provider = 관리자 대리 관리 케이스)
UPDATE provider
   SET status = 'active'
 WHERE id = 'd0000001-0000-0000-0000-000000000001';

-- updated_at 트리거 (0019의 테이블 루프에 provider가 이미 포함되어 있으면 중복 생성 방지)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_provider_updated_at' AND tgrelid = 'provider'::regclass
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'provider'::regclass AND tgname LIKE '%updated%'
  ) THEN
    CREATE TRIGGER trg_provider_updated_at BEFORE UPDATE ON provider
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END $$;

-- RLS 명목 정책: 본인 행 조회/수정 (실코드는 adminClient + 앱단 검증 — 0019 관례와 동일)
CREATE POLICY provider_self_select ON provider
  FOR SELECT USING (auth_user_id = auth.uid());
CREATE POLICY provider_self_update ON provider
  FOR UPDATE USING (auth_user_id = auth.uid());
