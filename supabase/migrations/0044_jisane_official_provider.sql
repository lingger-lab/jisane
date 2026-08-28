-- 0044: 지사네 공식 provider — knowledge-studio '지사네 자체' 지식서비스의 소속. additive, 재실행 안전.
--
-- ★ auth_user_id·email 영구 NULL 불변식:
--   applyAsPartner(apps/admin/lib/partner/actions.ts)는 auth_user_id NULL + email 일치 시
--   dangling provider 행을 사용자 계정에 연결(사실상 탈취)한다. email을 NULL로 고정하면
--   그 어떤 OAuth 사용자도 이 플랫폼 provider(와 소속 지사네 자체 서비스)를 획득할 수 없다.

INSERT INTO provider (id, name, type, kind, status, auth_user_id, email)
VALUES ('d0000002-0000-0000-0000-000000000002', '지사네', 'consulting', 'company', 'active', NULL, NULL)
ON CONFLICT (id) DO NOTHING;
