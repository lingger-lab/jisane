-- 누락 인덱스 추가 (대시보드 쿼리 최적화)

-- deal.status: admin 대시보드 요약 카운트 (매 로드마다 eq('status', 'working'))
create index if not exists idx_deal_status on deal(status);

-- partner.status: 후보 검색 시 active 필터
create index if not exists idx_partner_status on partner(status);

-- guarantee_fund_ledger.entry_type: 적립금 요약 쿼리
create index if not exists idx_guarantee_ledger_type on guarantee_fund_ledger(entry_type);

-- guarantee_fund_ledger.created_at: 원장 정렬
create index if not exists idx_guarantee_ledger_created on guarantee_fund_ledger(created_at);

-- review.author_type: 중복 리뷰 확인 쿼리
create index if not exists idx_review_author on review(author_type);

-- client.status: 활성 클라이언트 조회
create index if not exists idx_client_status on client(status);
