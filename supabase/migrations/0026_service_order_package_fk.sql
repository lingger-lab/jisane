-- ============================================================
-- 0026: service_order ↔ service_package 정합성
-- 스냅샷(package_slug/name/price/is_free)은 유지하고 nullable FK를 병행:
-- 파트너가 가격·이름을 수정해도 기존 주문 표시는 불변, 신규 주문은 FK로 정확 조인
-- ============================================================

ALTER TABLE service_order
  ADD COLUMN service_package_id uuid REFERENCES service_package(id) ON DELETE SET NULL;

-- 기존 주문 백필 (slug 전역 유니크 전제)
UPDATE service_order o
   SET service_package_id = p.id
  FROM service_package p
 WHERE p.slug = o.package_slug
   AND o.service_package_id IS NULL;

-- 파트너 "신청 확인" 목록 쿼리 커버 (provider_id 필터 + 최신순)
CREATE INDEX idx_service_order_provider_created
  ON service_order(provider_id, created_at DESC);
