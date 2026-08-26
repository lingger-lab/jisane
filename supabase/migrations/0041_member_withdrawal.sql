-- 0041: 회원 탈퇴(soft-delete) — additive, 재실행 안전
--
-- 역할별 탈퇴는 하드삭제가 아니라 status='withdrawn' + 개인정보 익명화로 처리한다.
-- 하드삭제는 deal/matching FK RESTRICT + 전자상거래법 5년 보존의무로 불가.
-- withdrawn_at은 PIPA 파기 스케줄(보존기간 기산점), withdrawn_by는 본인/관리자 구분.
--
-- ※ ALTER TYPE ... ADD VALUE 는 같은 트랜잭션에서 새 값을 사용할 수 없으므로,
--   이 파일은 값·컬럼 추가만 하고 'withdrawn'을 쓰는 DML은 절대 포함하지 않는다.

ALTER TYPE owner_status    ADD VALUE IF NOT EXISTS 'withdrawn';
ALTER TYPE expert_status   ADD VALUE IF NOT EXISTS 'withdrawn';
ALTER TYPE provider_status ADD VALUE IF NOT EXISTS 'withdrawn';

ALTER TABLE owner    ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;
ALTER TABLE owner    ADD COLUMN IF NOT EXISTS withdrawn_by text CHECK (withdrawn_by IN ('self', 'admin'));
ALTER TABLE expert   ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;
ALTER TABLE expert   ADD COLUMN IF NOT EXISTS withdrawn_by text CHECK (withdrawn_by IN ('self', 'admin'));
ALTER TABLE provider ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;
ALTER TABLE provider ADD COLUMN IF NOT EXISTS withdrawn_by text CHECK (withdrawn_by IN ('self', 'admin'));

COMMENT ON COLUMN owner.withdrawn_at    IS '탈퇴 시각(soft-delete) — PIPA 보존기간 기산점';
COMMENT ON COLUMN expert.withdrawn_at   IS '탈퇴 시각(soft-delete) — PIPA 보존기간 기산점';
COMMENT ON COLUMN provider.withdrawn_at IS '탈퇴 시각(soft-delete) — PIPA 보존기간 기산점';
