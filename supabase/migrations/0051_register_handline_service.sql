-- 0051: 사주앱(핸드라인)을 지사네 지식서비스로 등록 (멱등 — slug 존재 시 재실행 무해).
--
-- 대상: Hand-Line(핸드라인) — 손금+사주 AI 분석 B2C 웹앱(hand-line.cloud, AI 해석/토스 유료).
-- 결정(사용자): 지사네 내부 상세페이지 + 설명 속 CTA(외부 URL 컬럼 미추가) / owner·expert 둘 다 노출 /
-- 아직 미배포라 visible=false(등록만, 공개 보류 — 배포 후 스튜디오에서 노출 전환).
--   * category=ax_consulting, pillar=ai_ax (AI 서비스로 근접 분류).
--   * target_audience='owner' — enum이 owner/expert뿐이라 'both' 없음. owner로 두면 owner 대상필터
--     서피스에 노출되고, expert 서피스(대시보드·랜딩·/knowledge)는 audience 무관 쿼리라 함께 노출됨.
--   * price=0 & is_free=false → 관례상 '상담 문의' 표기(가격 미정). hand-line.cloud 링크는 설명에 포함.

INSERT INTO service_package
  (provider_id, slug, category, pillar, name, description, price, is_free,
   deliverables, target_audience, featured, value_desc, status, visible, sort_order)
SELECT
  'd0000002-0000-0000-0000-000000000002',                    -- JISANE_OFFICIAL
  'handline-saju',
  'ax_consulting',
  'ai_ax',
  '핸드라인 — 손금·사주 AI 분석',
  '손금과 사주로 보는 나의 운명. 사진 한 장과 생년월일로 AI가 손금·사주를 통합 분석해 성향·궁합·운세를 리포트로 제공합니다. 지사네가 만든 AI 서비스입니다. 바로가기: https://hand-line.cloud',
  0,
  false,
  ARRAY['손금 분석 리포트','사주 분석 리포트','궁합·성향 해석'],
  'owner',
  false,
  '손금·사주 통합 AI 운세 분석',
  'published',
  false,                                                       -- 미배포 → 비노출
  (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM service_package)
WHERE NOT EXISTS (SELECT 1 FROM service_package WHERE slug = 'handline-saju');
