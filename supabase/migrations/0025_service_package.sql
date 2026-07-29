-- ============================================================
-- 0025: service_package 신설 — 하드코딩 카탈로그(service-catalog.ts)의 DB화
-- 파트너가 직접 서비스를 등록(draft)하고 관리자가 publish하는 구조의 기반
-- 시드 9행 = 현행 SERVICE_PACKAGES 배열과 1:1 동일 (sort_order = 배열 인덱스)
-- ============================================================

CREATE TYPE service_audience       AS ENUM ('owner', 'expert');
CREATE TYPE service_package_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE service_package (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      uuid NOT NULL REFERENCES provider(id) ON DELETE CASCADE,
  -- 전역 유니크: service_order.package_slug 스냅샷 룩업과 정합. 생성 후 불변 정책
  slug             text NOT NULL UNIQUE,
  category         service_category NOT NULL,
  name             text NOT NULL,
  description      text NOT NULL,
  price            int  NOT NULL CHECK (price >= 0),
  is_free          boolean NOT NULL DEFAULT false,
  deliverables     text[] NOT NULL DEFAULT '{}',
  duration         text,
  target_audience  service_audience NOT NULL,
  featured         boolean NOT NULL DEFAULT false,
  value_desc       text NOT NULL DEFAULT '',
  ax_dashboard_url text,
  status           service_package_status NOT NULL DEFAULT 'draft',
  sort_order       int NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_package_provider ON service_package(provider_id);
CREATE INDEX idx_service_package_browse   ON service_package(target_audience, status, category);

CREATE TRIGGER trg_service_package_updated_at BEFORE UPDATE ON service_package
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE service_package ENABLE ROW LEVEL SECURITY;

-- 공개된 패키지는 누구나 조회, 자기 패키지는 파트너 본인이 관리 (명목 정책 — 실코드는 adminClient)
CREATE POLICY service_package_public_select ON service_package
  FOR SELECT USING (status = 'published');
CREATE POLICY service_package_owner_all ON service_package
  FOR ALL USING (
    provider_id IN (SELECT id FROM provider WHERE auth_user_id = auth.uid())
  );

-- ── 시드: 현행 SERVICE_PACKAGES 9개 이관 (엔터랩스 d0000001-…0001) ──
INSERT INTO service_package
  (id, provider_id, slug, category, name, description, price, is_free, deliverables, duration, target_audience, featured, value_desc, ax_dashboard_url, status, sort_order)
VALUES
  ('e0000001-0000-0000-0000-000000000001', 'd0000001-0000-0000-0000-000000000001',
   'ax-diagnosis-free', 'ax_consulting', 'AX 무료 진단',
   'AX 5대 적용축(업무자동화·의사결정·리스크관리·마케팅·고객응대) 기반 진단. 비용 절감·수익 향상 포인트를 찾아 최우선 1곳으로 좁힙니다.',
   0, true, ARRAY['AX 5대 적용축 진단 리포트', '5가치 기반 우선순위 선정', '첫 AI 실험 계획서'],
   '1주', 'owner', true, 'AX 5대 적용축 진단으로 비용 절감 포인트 발견', '/ax-process', 'published', 0),

  ('e0000001-0000-0000-0000-000000000002', 'd0000001-0000-0000-0000-000000000001',
   'ax-coaching', 'ax_consulting', 'AX 전환 코칭',
   '구현의 사다리(챗봇→업무자동화→AI Agent)를 따라 작게 시작, 효과 측정, 확장까지 동행합니다. 자체 LLM/RAG 설계 포함.',
   500000, false, ARRAY['AI 도구 1개 적용 실험', '비용 절감·수익 향상 효과 측정 리포트', '자체 LLM/RAG 검토 보고서', '확장 로드맵'],
   '1개월', 'owner', false, '구현의 사다리를 따라 AI 도입부터 확장까지', '/ax-process', 'published', 1),

  ('e0000001-0000-0000-0000-000000000003', 'd0000001-0000-0000-0000-000000000001',
   'lead-diagnosis', 'ax_consulting', 'AI 사업 진단',
   'Claude AI 기반 사업 진단. AX 5가치(비용절감·수익향상·리스크감소·신규수익모델·고객만족) 관점에서 맞춤 전환 전략을 제공합니다.',
   200000, false, ARRAY['AX 5가치 기반 AI 진단 카드', 'AX 적용축 매핑 보고서', '분기별 실행 로드맵'],
   '3일', 'owner', false, '데이터 기반 의사결정 진단', '/ax', 'published', 2),

  ('e0000001-0000-0000-0000-000000000004', 'd0000001-0000-0000-0000-000000000001',
   'biz-plan-writing', 'biz_consulting', '사업계획서 작성',
   'AI 기반 사업계획서 자동생성 + 전문가 검수. 40개 질문 응답으로 완성.',
   300000, false, ARRAY['사업계획서 (DOCX/PDF)', '전문가 검수 코멘트'],
   '1주', 'owner', false, 'AI 기반 자동생성 + 전문가 검수', null, 'published', 3),

  ('e0000001-0000-0000-0000-000000000005', 'd0000001-0000-0000-0000-000000000001',
   'gov-subsidy-application', 'biz_consulting', '정부지원사업 신청대행',
   '50건+ 정부과제 경험. 지원사업 선별 + 신청서 작성 + 제출 대행.',
   1000000, false, ARRAY['지원사업 매칭 리포트', '신청서 완성본', '제출 대행'],
   '2주', 'owner', false, '50건+ 경험 기반 지원사업 선별·신청 대행', null, 'published', 4),

  ('e0000001-0000-0000-0000-000000000006', 'd0000001-0000-0000-0000-000000000001',
   'biz-diagnosis', 'biz_consulting', '경영진단',
   '제1원칙 프레임워크 기반 사업 분석. 전제 파헤치기 → 근본 원리 → 실행 로드맵.',
   500000, false, ARRAY['6단계 분석 보고서 (DOCX)', '실행 로드맵', '30일 액션플랜'],
   '2주', 'owner', false, '제1원칙 프레임워크 기반 사업 분석', null, 'published', 5),

  ('e0000001-0000-0000-0000-000000000007', 'd0000001-0000-0000-0000-000000000001',
   'ai-tools-workshop', 'education', 'AI 도구 워크숍',
   '비개발자를 위한 AI 코딩 환경 셋업 + 실습. Claude, Cursor, 바이브코딩 기초.',
   100000, false, ARRAY['실습 환경 셋업', '핸즈온 가이드 (15~20p)', '수료증'],
   '3시간', 'expert', false, 'Claude, Cursor로 AI 코딩 환경 실습', null, 'published', 6),

  ('e0000001-0000-0000-0000-000000000008', 'd0000001-0000-0000-0000-000000000001',
   'content-pipeline-course', 'education', '콘텐츠 파이프라인 과정',
   'AX 5스킬 콘텐츠 파이프라인 — 신호 수집 → 뉴스레터 → AEO 블로그 → 서사 → 숏폼.',
   300000, false, ARRAY['5스킬 실습', '개인 파이프라인 셋업', '수료증'],
   '2일', 'expert', false, 'AX 5스킬 콘텐츠 파이프라인 구축', null, 'published', 7),

  ('e0000001-0000-0000-0000-000000000009', 'd0000001-0000-0000-0000-000000000001',
   'prompt-engineering', 'education', '프롬프트 엔지니어링 기초',
   'CoT, ToT, ReAct 등 검증 기법 조합. 최적화 프롬프트 설계 능력 습득.',
   150000, false, ARRAY['실습 워크북', '프롬프트 템플릿 10종', '수료증'],
   '3시간', 'expert', false, 'CoT, ToT, ReAct 검증 기법 실습', null, 'published', 8);
