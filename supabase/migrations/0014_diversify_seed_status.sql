-- ============================================================
-- 시드 의뢰 상태 다양화
-- 모든 700건이 'open' → 카테고리별 불균등 분배
-- ============================================================

-- 1. ~200건을 closed로 변경 (md5 해시 기반 결정적 선택)
UPDATE request
SET status = 'closed', updated_at = now()
WHERE status = 'open'
  AND substr(md5(id::text || 'close_salt'), 1, 1) IN ('0', '1', '2', '3', '4');

-- 2. ~70건을 matching으로 변경
UPDATE request
SET status = 'matching', updated_at = now()
WHERE status = 'open'
  AND substr(md5(id::text || 'match_salt'), 1, 1) IN ('a', 'b');

-- 3. created_at을 더 다양하게 (1~90일 전)
UPDATE request
SET created_at = now() - ((1 + abs(('x' || substr(md5(id::text || 'date_salt'), 1, 4))::bit(16)::int % 90)) || ' days')::interval;
