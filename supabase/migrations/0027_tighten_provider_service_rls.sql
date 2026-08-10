-- ============================================================
-- 0027: provider·service_package RLS 강화 (자가 승격·자가 publish 차단)
-- ============================================================
-- 배경(감사 docs/11 P1-19·P1-22):
--   0024 provider_self_update = FOR UPDATE, WITH CHECK 없음 → 파트너가 PostgREST로
--        본인 row의 status(pending→active)를 직접 바꿔 관리자 승인을 우회 가능.
--   0025 service_package_owner_all = FOR ALL, 컬럼/상태 제한 없음 → 파트너가 직접
--        status='published'로 write해 관리자 publish 게이트를 우회 가능.
-- 근거: 두 테이블의 read/write는 앱 전 경로가 service_role(adminClient) 경유이며
--   (apps/admin/lib/partner/actions.ts, partner 대시보드 페이지들), client(anon/authenticated)
--   직접 write 경로가 없다. 따라서 과다 허용 write 정책을 제거해도 앱 흐름에 영향이 없고,
--   RLS는 방어선(defense-in-depth)으로서 SELECT만 허용하도록 좁힌다. (의사환경 검증 완료)
-- reversible: 아래 DROP된 정책을 다시 CREATE하면 원복.

-- provider: 자가 UPDATE 정책 제거 (status 자가 승격 차단). 조회는 provider_self_select 유지.
DROP POLICY IF EXISTS provider_self_update ON provider;

-- service_package: FOR ALL(write 포함) 정책 제거 → 자가 publish 차단.
DROP POLICY IF EXISTS service_package_owner_all ON service_package;
-- 파트너 본인 draft 조회는 SELECT 전용 정책으로 보존(공개 조회는 service_package_public_select).
CREATE POLICY service_package_owner_select ON service_package
  FOR SELECT USING (
    provider_id IN (SELECT id FROM provider WHERE auth_user_id = auth.uid())
  );
