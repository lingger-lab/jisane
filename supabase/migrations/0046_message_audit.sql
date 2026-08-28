-- 0046: 회원 메시지 은밀 감사 계층 — additive, 재실행 안전.
--
-- 목적: 발주자↔공급자 메시지(deal_message·service_order_message)의 '정상 여부'를 관리자가 감사한다.
-- 은닉: **회원 앱은 이 테이블을 참조하지 않고**, RLS 정책 0(service-role 전용)이라 회원에 노출되지 않는다
--       (review.internal_note·audit_sampled 은닉 선례와 동일 계열, 단 회원이 읽는 테이블과 물리 분리).
-- 폴리모픽(channel+message_id): 두 메시지 채널을 한 곳에서 감사. FK 대신 UNIQUE(channel,message_id)+앱 정합.

DO $$ BEGIN
  CREATE TYPE message_audit_channel AS ENUM ('deal', 'service_order');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE message_audit_status AS ENUM ('unreviewed', 'normal', 'suspicious', 'violation');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS message_audit (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel         message_audit_channel NOT NULL,
  message_id      uuid NOT NULL,                              -- FK 없음(폴리모픽) — UNIQUE로 중복 방지
  status          message_audit_status NOT NULL DEFAULT 'unreviewed',
  flagged_reasons text[] NOT NULL DEFAULT '{}',               -- phone|bank_account|messenger|email|direct_deal
  auto_flagged    boolean NOT NULL DEFAULT false,
  note            text,                                        -- 관리자 내부메모(회원 영구 비노출)
  audited_by      text,                                        -- admin email
  audited_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, message_id)
);

CREATE INDEX IF NOT EXISTS idx_message_audit_triage ON message_audit (status, created_at DESC);

ALTER TABLE message_audit ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = service-role만 접근. anon/authenticated(publishable 키)는 유출 시도조차 DB에서 차단.
