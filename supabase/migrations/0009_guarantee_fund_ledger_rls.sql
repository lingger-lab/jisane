-- guarantee_fund_ledger: RLS 활성화
-- admin(service_role)만 접근 가능하도록 정책 없이 RLS만 활성화
-- authenticated 사용자는 이 테이블에 직접 접근할 수 없음

alter table guarantee_fund_ledger enable row level security;
