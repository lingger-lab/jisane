-- ============================================================
-- 시드 데이터: matching 레코드 생성
-- status='matching'인 의뢰에 대응하는 matching 레코드가 없어
-- 대시보드 "매칭 진행" 탭에 표시되지 않던 문제 수정
-- ============================================================

-- status='matching'인 의뢰마다 파트너 1명을 결정적으로 배정
-- md5 해시 기반으로 30명의 시드 파트너 중 1명 선택
INSERT INTO matching (request_id, partner_id, status, created_at)
SELECT
  r.id,
  ('c00000' || lpad(
    (1 + abs(('x' || substr(md5(r.id::text || 'partner_salt'), 1, 4))::bit(16)::int % 30))::text,
    2, '0'
  ) || '-0000-0000-0000-000000000001')::uuid,
  'proposed',
  r.updated_at
FROM request r
WHERE r.status = 'matching'
  AND NOT EXISTS (
    SELECT 1 FROM matching m WHERE m.request_id = r.id
  );
