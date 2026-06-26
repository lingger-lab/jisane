-- client 테이블: 인증 사용자가 자신의 레코드를 조회할 수 있도록 SELECT 정책 추가
create policy client_select_own on client for select
  using (auth_user_id = auth.uid());
