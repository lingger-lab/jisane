-- ============================================================
-- 0028: deal_message 발신자 위조 방지 + service_package.slug 불변 강제
-- ============================================================

-- P2-68: owner_send_message 정책이 sender_id를 바인딩하지 않아, owner가 임의 sender_id로
--   메시지를 삽입해 발신자를 위조할 수 있었다(expert_insert_deal_message는 sender_id를 바인딩).
--   RLS는 방어선(앱은 service_role 경유)이나 경계 자체가 위조를 허용하면 안 되므로 바인딩 추가.
DROP POLICY IF EXISTS owner_send_message ON deal_message;
CREATE POLICY owner_send_message ON deal_message FOR INSERT
  WITH CHECK (
    sender_type = 'owner' AND
    sender_id IN (SELECT id FROM owner WHERE auth_user_id = auth.uid()) AND
    deal_id IN (
      SELECT d.id FROM deal d
      JOIN request r ON d.request_id = r.id
      JOIN owner o ON r.owner_id = o.id
      WHERE o.auth_user_id = auth.uid()
    )
  );

-- P2-70: service_package.slug은 service_order.package_slug 스냅샷 룩업과 정합하므로 생성 후
--   불변이어야 하는데(0025 주석) DB에 강제가 없었다. 변경을 거부하는 BEFORE UPDATE 트리거 추가.
CREATE OR REPLACE FUNCTION prevent_service_package_slug_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS DISTINCT FROM OLD.slug THEN
    RAISE EXCEPTION 'service_package.slug은 생성 후 변경할 수 없습니다 (order 스냅샷 정합)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_service_package_slug_immutable ON service_package;
CREATE TRIGGER trg_service_package_slug_immutable
  BEFORE UPDATE ON service_package
  FOR EACH ROW EXECUTE FUNCTION prevent_service_package_slug_change();
