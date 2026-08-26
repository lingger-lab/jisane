-- 0042: 정합성 DB 백스톱 — 부분/복합 유니크 인덱스 (감사 리팩토링 5)
--
-- 앱 레벨 CAS(0041까지 도입)에 더해, 경합·이중클릭·중복제출을 DB 불변식으로 최종 차단한다.
-- ⚠️ 기존 데이터에 이미 위반(중복) 행이 있으면 CREATE UNIQUE INDEX가 실패한다.
--    실패 시 아래 진단/정리 쿼리로 중복을 먼저 해소한 뒤 재실행할 것.
--    (지사네 현재 데이터는 대부분 시드 1:1이라 통상 성공하나, 운영 중 생성분 확인 권장)

-- 1) 한 의뢰(request)에 진행 중 매칭은 하나만 — 매칭 중복 생성(P1-1) 구조적 차단.
CREATE UNIQUE INDEX IF NOT EXISTS uq_matching_active_request
  ON matching (request_id)
  WHERE status IN ('proposed', 'accepted');

-- 2) 한 딜에 작성자 유형별 리뷰는 하나만 — 동시 제출 중복 리뷰·스코어 이중반영(P2-7) 차단.
CREATE UNIQUE INDEX IF NOT EXISTS uq_review_deal_author
  ON review (deal_id, author_type);

-- 3) 한 의뢰에 같은 expert 후보는 하나만 — 후보 생성 이중클릭 중복(P3-6) 차단.
CREATE UNIQUE INDEX IF NOT EXISTS uq_matching_candidate_req_expert
  ON matching_candidate (request_id, expert_id);

-- ── 위반 데이터 진단(실패 시 먼저 실행) ──
-- SELECT request_id, count(*) FROM matching WHERE status IN ('proposed','accepted')
--   GROUP BY request_id HAVING count(*) > 1;
-- SELECT deal_id, author_type, count(*) FROM review GROUP BY deal_id, author_type HAVING count(*) > 1;
-- SELECT request_id, expert_id, count(*) FROM matching_candidate GROUP BY request_id, expert_id HAVING count(*) > 1;
