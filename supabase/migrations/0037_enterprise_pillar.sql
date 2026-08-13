-- 0037: 기업(owner) 전문서비스 "5대 지원" 분류(pillar) — additive, 재실행 안전
--
-- 오너 랜딩 "5대 지원" 카드를 실제 서비스에 연결하기 위한 분류축.
-- 기존 service_category(ax_consulting/biz_consulting/education) enum은 불변 — pillar는 별개 축이다.
-- owner 기업서비스에만 세팅하고 expert/education 행은 NULL로 둔다.

-- CREATE TYPE는 IF NOT EXISTS를 지원하지 않으므로 DO 가드로 재실행 안전 처리
DO $$ BEGIN
  CREATE TYPE enterprise_pillar AS ENUM
    ('biz_marketing', 'finance_tax', 'tech_quality', 'online_sales', 'ai_ax');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE service_package
  ADD COLUMN IF NOT EXISTS pillar enterprise_pillar;   -- nullable

-- owner + published + pillar 필터용 인덱스
CREATE INDEX IF NOT EXISTS idx_service_package_pillar
  ON service_package (target_audience, status, pillar);

-- ── 기존 owner 6건 백필 (slug 기준 — 재실행 안전) ──
UPDATE service_package SET pillar = 'ai_ax'
  WHERE slug IN ('ax-diagnosis-free', 'ax-coaching', 'lead-diagnosis');
UPDATE service_package SET pillar = 'biz_marketing'
  WHERE slug IN ('biz-plan-writing', 'gov-subsidy-application');
UPDATE service_package SET pillar = 'finance_tax'
  WHERE slug = 'biz-diagnosis';

-- ── 서비스 없는 pillar(tech_quality, online_sales) 각 1건 시드 ──
-- 엔터랩스(d0000001-…0001), owner, published. 가격정책 미정 → price=0 & is_free=false = "상담 문의" sentinel.
INSERT INTO service_package
  (id, provider_id, slug, category, name, description, price, is_free, deliverables,
   duration, target_audience, featured, value_desc, ax_dashboard_url, status, sort_order, pillar)
VALUES
  ('e0000001-0000-0000-0000-000000000010', 'd0000001-0000-0000-0000-000000000001',
   'quality-process-consulting', 'biz_consulting', '생산·품질 공정 진단',
   '생산 공정과 품질 관리 체계를 진단하고 개선 로드맵을 제시합니다.',
   0, false, ARRAY['공정 진단 리포트', '품질 체계 개선 로드맵'],
   NULL, 'owner', false, '생산 공정·품질 체계 진단과 개선 자문', NULL, 'published', 9, 'tech_quality'),
  ('e0000001-0000-0000-0000-000000000011', 'd0000001-0000-0000-0000-000000000001',
   'online-channel-marketing', 'biz_consulting', '온라인 판로개척 지원',
   '온라인 채널·홍보 전략을 수립하고 판로 확대를 지원합니다.',
   0, false, ARRAY['채널 전략 리포트', '홍보 콘텐츠 가이드'],
   NULL, 'owner', false, '온라인 채널·홍보로 판로 확대', NULL, 'published', 10, 'online_sales')
ON CONFLICT (slug) DO NOTHING;
