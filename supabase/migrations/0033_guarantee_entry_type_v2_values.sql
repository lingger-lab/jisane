-- ============================================================
-- 0033: guarantee_fund_ledger entry_type에 v2 값 추가 (docs/16 §2.3)
-- ============================================================
-- 기존 enum 확장은 이 파일 단독으로 격리한다 (docs/16 §11.3 — 0021 fresh-reset
-- 전력). ALTER TYPE ... ADD VALUE는 같은 트랜잭션에서 새 값을 사용할 수 없으므로
-- 이 파일에는 다른 DDL/DML을 넣지 않는다. 0023(accrue/payout 추가)과 동일 패턴 —
-- fresh 전체체인(0019 CREATE TYPE 이후)·incremental 양쪽에서 동작, 멱등.
--
--   risk_reserve    : v2 위험적립(1%) — auto-settlement 적립 소스가
--                     guarantee_fee → settlement.risk_reserve_amt로 대체(§11.2)
--   credit_recovery : 분쟁 복구 시 보류분 부족액을 guarantee_fund에서 충당(§7.1)

ALTER TYPE guarantee_entry_type ADD VALUE IF NOT EXISTS 'risk_reserve';
ALTER TYPE guarantee_entry_type ADD VALUE IF NOT EXISTS 'credit_recovery';

-- ============================================================
-- 롤백 노트: Postgres는 enum 값 제거를 지원하지 않는다.
--   미사용 상태라면 사실상 무해(값 존재 자체는 부작용 없음).
--   완전 제거가 필요하면 타입 재생성+컬럼 재바인딩(파괴적) — 권장하지 않음.
-- ============================================================
