-- 스테이징 스키마 검증 — 마이그레이션 0001~0042 적용 후 SQL Editor에서 실행.
-- 각 쿼리가 "존재/카운트 정상"을 반환해야 스테이징 준비 완료. (특히 최근 0040~0042 확인)

-- 1) 회원 status enum에 'withdrawn' 포함 (0041)
SELECT 'owner_status'    AS enum, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
  FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'owner_status'
UNION ALL SELECT 'expert_status',   array_agg(e.enumlabel ORDER BY e.enumsortorder)
  FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'expert_status'
UNION ALL SELECT 'provider_status', array_agg(e.enumlabel ORDER BY e.enumsortorder)
  FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid WHERE t.typname = 'provider_status';
-- 기대: 각 배열에 'withdrawn' 포함

-- 2) 회원 탈퇴 컬럼 (0041) + expert 실명 (0040)
SELECT table_name, column_name
  FROM information_schema.columns
 WHERE (table_name IN ('owner','expert','provider') AND column_name IN ('withdrawn_at','withdrawn_by'))
    OR (table_name = 'expert' AND column_name = 'real_name')
 ORDER BY table_name, column_name;
-- 기대: owner/expert/provider × withdrawn_at·withdrawn_by (6) + expert.real_name (1) = 7행

-- 3) service_order_message 테이블 + service_msg_sender enum (0039)
SELECT to_regclass('public.service_order_message') AS service_order_message_table,
       (SELECT count(*) FROM pg_type WHERE typname = 'service_msg_sender') AS service_msg_sender_enum;
-- 기대: 테이블 not null · enum 1

-- 4) 정합성 백스톱 유니크 인덱스 (0042)
SELECT indexname FROM pg_indexes
 WHERE indexname IN ('uq_matching_active_request','uq_review_deal_author','uq_matching_candidate_req_expert')
 ORDER BY indexname;
-- 기대: 3개 모두 존재

-- 5) 마이그레이션 전량 반영 개수(supabase_migrations 사용 시)
SELECT count(*) AS applied_migrations
  FROM supabase_migrations.schema_migrations;  -- 기대: 로컬 supabase/migrations 파일 수와 일치
