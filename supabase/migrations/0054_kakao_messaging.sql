-- 0054: 마케팅 발송(카카오 친구톡/문자 LMS) — 캠페인 + 발송 로그. (Phase 3 껍데기, 키 없으면 미발송)
--
-- 발송 자체는 발송대행사(Solapi 등) 키가 설정돼야 동작한다(notify/kakao.ts). 이 테이블은 발송 기록·
-- 중복방지·이력 화면용. 대상 세그먼트는 consent_log(marketing_kakao 최신 granted)에서 계산한다.
-- 접근: 관리자 서버액션(service-role)만 — RLS 활성 + 정책 없음.

CREATE TYPE message_channel AS ENUM ('friendtalk', 'lms');
CREATE TYPE campaign_status AS ENUM ('draft', 'scheduled', 'sending', 'done', 'failed', 'canceled');
CREATE TYPE send_status     AS ENUM ('queued', 'sent', 'failed', 'rejected');

CREATE TABLE message_campaign (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  channel       message_channel NOT NULL,
  body          text NOT NULL,                       -- 관리자 입력 본문((광고)·수신거부는 발송 시 조립)
  status        campaign_status NOT NULL DEFAULT 'draft',
  scheduled_at  timestamptz,
  target_count  int NOT NULL DEFAULT 0,
  sent_count    int NOT NULL DEFAULT 0,
  failed_count  int NOT NULL DEFAULT 0,
  created_by    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE message_send_log (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         uuid NOT NULL REFERENCES message_campaign(id) ON DELETE CASCADE,
  phone               text NOT NULL,
  owner_id            uuid REFERENCES owner(id)  ON DELETE SET NULL,
  expert_id           uuid REFERENCES expert(id) ON DELETE SET NULL,
  status              send_status NOT NULL DEFAULT 'queued',
  provider_message_id text,
  error               text,
  sent_at             timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, phone)                          -- 캠페인 내 동일번호 중복발송 방지
);

CREATE INDEX idx_message_send_log_campaign ON message_send_log(campaign_id);

ALTER TABLE message_campaign  ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_send_log  ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = service-role(관리자 서버액션)만 접근.
