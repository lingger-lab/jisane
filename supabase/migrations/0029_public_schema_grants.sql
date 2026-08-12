-- 0029: public 스키마 API 롤 권한 명시 (fresh 스택 전면 불능 해소)
--
-- 배경: 새 Supabase 스택(CLI 2.1xx 로컬 이미지)은 postgres 롤이 만든 public 테이블에
-- anon/authenticated/service_role의 DML 기본권한을 더 이상 부여하지 않는다
-- (기본 ACL이 Dxtm — TRUNCATE/REFERENCES/TRIGGER/MAINTAIN만. 2026-08-12 로컬 fresh
-- apply 후 런타임 스모크에서 전 테이블 permission denied로 확인). 프로드는 구 기본권한
-- 시절에 생성돼 이미 전체 GRANT를 보유하므로, 이 마이그레이션은 체인을 프로드와
-- 일치시키는 덧셈이며 재적용해도 무해(GRANT는 멱등). 행 수준 접근 통제는 여전히
-- RLS(0027·0028 포함)가 담당한다 — 이 GRANT는 테이블 수준 전제조건일 뿐이다.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public
  TO anon, authenticated, service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public
  TO anon, authenticated, service_role;

-- 이후 마이그레이션이 만드는 테이블/시퀀스/함수에도 같은 권한이 자동 부여되도록
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;
