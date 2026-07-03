-- 복합 인덱스 추가 (대시보드/리스트 쿼리 최적화)

-- deal: status + created_at 정렬 (대시보드 진행 중 거래 목록)
CREATE INDEX IF NOT EXISTS idx_deal_status_created ON deal(status, created_at DESC);

-- request: status + created_at 정렬 (의뢰 탐색, 대시보드 매칭 대기 목록)
CREATE INDEX IF NOT EXISTS idx_request_status_created ON request(status, created_at DESC);

-- review: deal_id + author_type (중복 리뷰 확인 유니크 체크)
CREATE INDEX IF NOT EXISTS idx_review_deal_author ON review(deal_id, author_type);

-- partner_interest: request_id + created_at (의뢰별 관심 표현 목록)
CREATE INDEX IF NOT EXISTS idx_interest_request_created ON partner_interest(request_id, created_at DESC);

-- guarantee_fund_ledger: entry_type + created_at (적립금 원장 타입별 정렬)
CREATE INDEX IF NOT EXISTS idx_guarantee_type_created ON guarantee_fund_ledger(entry_type, created_at DESC);

-- matching_candidate: request_id + rank (AI 후보 목록 순위 조회)
CREATE INDEX IF NOT EXISTS idx_candidate_request_rank ON matching_candidate(request_id, rank);
