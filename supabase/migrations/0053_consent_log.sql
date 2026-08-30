-- 0053: 개인정보·마케팅 동의 원장(append-only) — 법적 증빙 + 마케팅 세그먼트의 단일 소스.
--
-- 각 동의/철회를 한 행으로 append. phone별 item의 '최신' action이 현재 상태다.
-- 마케팅 발송 대상 = marketing_kakao의 최신 action이 'granted'인 phone 집합.
-- 모든 쓰기는 서버 액션(service-role) 경유 — RLS 활성 + 정책 없음.

CREATE TYPE consent_item   AS ENUM ('privacy_consult', 'marketing_kakao');
CREATE TYPE consent_action AS ENUM ('granted', 'withdrawn');

CREATE TABLE consent_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       text NOT NULL,                    -- 정규화(숫자만) — 비회원 포함 세그먼트 키
  owner_id    uuid REFERENCES owner(id)  ON DELETE SET NULL,
  expert_id   uuid REFERENCES expert(id) ON DELETE SET NULL,
  inquiry_id  uuid REFERENCES consultation_inquiry(id) ON DELETE SET NULL,
  item        consent_item   NOT NULL,
  action      consent_action NOT NULL,
  version     text NOT NULL,                     -- 동의 시점 방침 버전
  source      text NOT NULL,                     -- 'inquiry_form'|'mypage'|'unsubscribe_link'|'admin'
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_consent_log_phone_item ON consent_log(phone, item, created_at DESC);

ALTER TABLE consent_log ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = service-role(서버 액션)만 접근.
