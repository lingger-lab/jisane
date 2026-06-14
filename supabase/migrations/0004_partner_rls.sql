-- ============================================================
-- 곁에(yourside) Phase 4: 파트너 RLS 정책
-- Supabase SQL Editor에서 실행
-- ============================================================

-- 파트너 본인 프로필 조회
create policy partner_select_own on partner for select
  using (auth_user_id = auth.uid());

-- 파트너 본인 프로필 수정
create policy partner_update_own on partner for update
  using (auth_user_id = auth.uid());

-- 파트너 본인 deal 조회
create policy partner_select_own_deal on deal for select
  using (partner_id in (
    select id from partner where auth_user_id = auth.uid()
  ));

-- 파트너 본인 워크플로우 조회
create policy partner_select_own_workflow on deal_workflow for select
  using (deal_id in (
    select id from deal where partner_id in (
      select id from partner where auth_user_id = auth.uid()
    )
  ));

-- 파트너 본인 워크플로우 수정
create policy partner_update_own_workflow on deal_workflow for update
  using (deal_id in (
    select id from deal where partner_id in (
      select id from partner where auth_user_id = auth.uid()
    )
  ));

-- 파트너 본인 정산 조회
create policy partner_select_own_settlement on settlement for select
  using (deal_id in (
    select id from deal where partner_id in (
      select id from partner where auth_user_id = auth.uid()
    )
  ));
