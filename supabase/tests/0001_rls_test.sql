-- ============================================================
-- RLS 정책 검증 스크립트
-- Supabase SQL Editor에서 실행하여 권한 분리를 확인합니다.
--
-- 사용법:
--   1. Supabase Dashboard → SQL Editor
--   2. 이 스크립트 전체를 붙여넣고 실행
--   3. 모든 결과가 PASS인지 확인
-- ============================================================

-- 헬퍼: 테스트 결과 저장용 임시 테이블
create temp table if not exists _rls_results (
  test_name text,
  result text,
  detail text
);

-- ────────────────────────────────────────
-- 1. RLS가 활성화된 테이블 확인
-- ────────────────────────────────────────
do $$
declare
  expected_tables text[] := array[
    'client', 'partner', 'request', 'deal', 'matching',
    'settlement', 'review', 'inquiry', 'deal_workflow',
    'service_order', 'partner_interest', 'deal_message',
    'guarantee_fund_ledger'
  ];
  tbl text;
  rls_on boolean;
begin
  foreach tbl in array expected_tables loop
    select relrowsecurity into rls_on
    from pg_class
    where relname = tbl and relnamespace = 'public'::regnamespace;

    if rls_on is true then
      insert into _rls_results values (
        'RLS enabled: ' || tbl, 'PASS', 'RLS is ON'
      );
    else
      insert into _rls_results values (
        'RLS enabled: ' || tbl, 'FAIL',
        'RLS is OFF — 보안 위험!'
      );
    end if;
  end loop;
end $$;

-- ────────────────────────────────────────
-- 2. 정책 존재 여부 확인 (테이블별 최소 1개)
-- ────────────────────────────────────────
do $$
declare
  tables_needing_policies text[] := array[
    'client', 'partner', 'request', 'deal', 'matching',
    'settlement', 'inquiry', 'deal_workflow',
    'service_order', 'partner_interest', 'deal_message'
  ];
  tbl text;
  policy_count int;
begin
  foreach tbl in array tables_needing_policies loop
    select count(*) into policy_count
    from pg_policies
    where tablename = tbl and schemaname = 'public';

    if policy_count > 0 then
      insert into _rls_results values (
        'Policies exist: ' || tbl, 'PASS',
        policy_count || ' policies found'
      );
    else
      insert into _rls_results values (
        'Policies exist: ' || tbl, 'FAIL',
        'No policies — authenticated users can see nothing (deny all)'
      );
    end if;
  end loop;
end $$;

-- ────────────────────────────────────────
-- 3. admin-only 테이블: guarantee_fund_ledger
--    RLS ON + 정책 0개 = authenticated 사용자 접근 불가
-- ────────────────────────────────────────
do $$
declare
  policy_count int;
begin
  select count(*) into policy_count
  from pg_policies
  where tablename = 'guarantee_fund_ledger' and schemaname = 'public';

  if policy_count = 0 then
    insert into _rls_results values (
      'Admin-only: guarantee_fund_ledger', 'PASS',
      'No user policies — only service_role can access'
    );
  else
    insert into _rls_results values (
      'Admin-only: guarantee_fund_ledger', 'WARN',
      policy_count || ' policies found — intended?'
    );
  end if;
end $$;

-- ────────────────────────────────────────
-- 4. SELECT 정책 검증: client 테이블별
-- ────────────────────────────────────────
do $$
declare
  client_select_tables text[] := array[
    'request', 'deal', 'settlement', 'deal_workflow',
    'service_order', 'deal_message'
  ];
  tbl text;
  has_select boolean;
begin
  foreach tbl in array client_select_tables loop
    select exists(
      select 1 from pg_policies
      where tablename = tbl
        and schemaname = 'public'
        and cmd = 'SELECT'
        and (qual like '%client%' or policyname like '%client%')
    ) into has_select;

    if has_select then
      insert into _rls_results values (
        'Client SELECT: ' || tbl, 'PASS', 'Client read policy exists'
      );
    else
      insert into _rls_results values (
        'Client SELECT: ' || tbl, 'FAIL',
        'No client SELECT policy'
      );
    end if;
  end loop;
end $$;

-- ────────────────────────────────────────
-- 5. SELECT 정책 검증: partner 테이블별
-- ────────────────────────────────────────
do $$
declare
  partner_select_tables text[] := array[
    'matching', 'deal', 'deal_workflow', 'settlement',
    'service_order', 'partner_interest', 'deal_message'
  ];
  tbl text;
  has_select boolean;
begin
  foreach tbl in array partner_select_tables loop
    select exists(
      select 1 from pg_policies
      where tablename = tbl
        and schemaname = 'public'
        and cmd = 'SELECT'
        and (qual like '%partner%' or policyname like '%partner%')
    ) into has_select;

    if has_select then
      insert into _rls_results values (
        'Partner SELECT: ' || tbl, 'PASS', 'Partner read policy exists'
      );
    else
      insert into _rls_results values (
        'Partner SELECT: ' || tbl, 'FAIL',
        'No partner SELECT policy'
      );
    end if;
  end loop;
end $$;

-- ────────────────────────────────────────
-- 6. INSERT 정책 검증
-- ────────────────────────────────────────
do $$
declare
  insert_checks text[][] := array[
    array['request', 'client'],
    array['service_order', 'client'],
    array['service_order', 'partner'],
    array['partner_interest', 'partner'],
    array['deal_message', 'partner'],
    array['deal_message', 'client'],
    array['inquiry', 'inquiry']
  ];
  check_item text[];
  has_insert boolean;
begin
  foreach check_item slice 1 in array insert_checks loop
    select exists(
      select 1 from pg_policies
      where tablename = check_item[1]
        and schemaname = 'public'
        and cmd = 'INSERT'
        and (qual like '%' || check_item[2] || '%'
             or with_check like '%' || check_item[2] || '%'
             or policyname like '%' || check_item[2] || '%')
    ) into has_insert;

    if has_insert then
      insert into _rls_results values (
        check_item[2] || ' INSERT: ' || check_item[1], 'PASS',
        'Insert policy exists'
      );
    else
      insert into _rls_results values (
        check_item[2] || ' INSERT: ' || check_item[1], 'FAIL',
        'No insert policy for ' || check_item[2]
      );
    end if;
  end loop;
end $$;

-- ────────────────────────────────────────
-- 7. UPDATE/DELETE 정책 검증
-- ────────────────────────────────────────
do $$
begin
  -- partner 프로필 UPDATE
  if exists(
    select 1 from pg_policies
    where tablename = 'partner' and cmd = 'UPDATE'
      and policyname like '%partner%'
  ) then
    insert into _rls_results values (
      'Partner UPDATE: partner', 'PASS', 'Self-update policy exists'
    );
  else
    insert into _rls_results values (
      'Partner UPDATE: partner', 'FAIL', 'No self-update policy'
    );
  end if;

  -- partner_interest DELETE
  if exists(
    select 1 from pg_policies
    where tablename = 'partner_interest' and cmd = 'DELETE'
  ) then
    insert into _rls_results values (
      'Partner DELETE: partner_interest', 'PASS', 'Delete policy exists'
    );
  else
    insert into _rls_results values (
      'Partner DELETE: partner_interest', 'FAIL', 'No delete policy'
    );
  end if;

  -- deal_workflow UPDATE
  if exists(
    select 1 from pg_policies
    where tablename = 'deal_workflow' and cmd = 'UPDATE'
  ) then
    insert into _rls_results values (
      'Partner UPDATE: deal_workflow', 'PASS', 'Workflow update policy exists'
    );
  else
    insert into _rls_results values (
      'Partner UPDATE: deal_workflow', 'FAIL', 'No workflow update policy'
    );
  end if;
end $$;

-- ════════════════════════════════════════
-- 결과 출력
-- ════════════════════════════════════════
select
  result,
  test_name,
  detail
from _rls_results
order by
  case result
    when 'FAIL' then 1
    when 'WARN' then 2
    when 'PASS' then 3
  end,
  test_name;

-- 요약
select
  count(*) filter (where result = 'PASS') as pass_count,
  count(*) filter (where result = 'FAIL') as fail_count,
  count(*) filter (where result = 'WARN') as warn_count,
  count(*) as total
from _rls_results;

-- 정리
drop table if exists _rls_results;
