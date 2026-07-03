-- 누락된 updated_at 컬럼 + 트리거 추가

-- 1. guarantee_fund_ledger: updated_at 컬럼은 있지만 트리거 누락
CREATE TRIGGER trg_guarantee_fund_ledger_updated BEFORE UPDATE ON guarantee_fund_ledger
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 2. matching_candidate: status 변경 추적 필요
ALTER TABLE matching_candidate ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER trg_matching_candidate_updated BEFORE UPDATE ON matching_candidate
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 3. review_ai_suggestion: status 변경 추적 필요
ALTER TABLE review_ai_suggestion ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
CREATE TRIGGER trg_review_ai_suggestion_updated BEFORE UPDATE ON review_ai_suggestion
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
