-- 0052: 상담문의 리드 접수 테이블 — 단일 문의접수 경로 + 관리자 접수처리(Phase 1 MVP).
--
-- 배경: 지금까지 '상담 신청' CTA는 service_order(결제 주문·로그인 필수)를 만들었다. 무료/상담문의
-- 성격의 접수는 리드(이름·연락처·동의)로 받아야 마케팅 세그먼트를 만들 수 있어 별도 테이블로 분리한다.
-- 유료(price>0) 결제 주문은 기존 service_order 경로를 그대로 유지한다.
--
-- 접근: 모든 읽기/쓰기는 서버 액션(adminClient=service-role) 경유. RLS 활성 + 정책 없음 = 클라 직접차단.

CREATE TYPE consultation_status AS ENUM ('received', 'assigned', 'in_progress', 'done', 'on_hold', 'spam');

CREATE TABLE consultation_inquiry (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL,
  phone               text NOT NULL,                    -- 정규화(숫자만) 저장 — 발송 키
  detail              text,

  -- 대상 서비스 스냅샷(서비스가 삭제돼도 접수 이력 보존)
  service_package_id  uuid REFERENCES service_package(id) ON DELETE SET NULL,
  package_slug        text,
  package_name        text,
  category            service_category,
  provider_id         uuid REFERENCES provider(id) ON DELETE SET NULL,

  -- 회원 연결(로그인 접수 시). 비회원이면 둘 다 NULL
  owner_id            uuid REFERENCES owner(id)  ON DELETE SET NULL,
  expert_id           uuid REFERENCES expert(id) ON DELETE SET NULL,

  -- 접수처리
  status              consultation_status NOT NULL DEFAULT 'received',
  assigned_admin      text,
  admin_note          text,

  -- 동의 스냅샷(원장은 consent_log, 여기엔 접수 시점 값)
  privacy_consent_at    timestamptz NOT NULL,           -- 필수 동의(없으면 접수 불가 — 앱에서 검증)
  marketing_consent_at  timestamptz,                    -- 선택 동의(NULL=미동의)
  consent_version       text NOT NULL,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consultation_inquiry_status_created ON consultation_inquiry(status, created_at DESC);
CREATE INDEX idx_consultation_inquiry_phone          ON consultation_inquiry(phone);

ALTER TABLE consultation_inquiry ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = service-role(서버 액션)만 접근. 회원 직접 read/write 불가.
