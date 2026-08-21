-- 0039: 서비스 주문 3자 메시지 스레드 (기업회원↔전문가회원(공급자)↔관리자) — additive, 재실행 안전
--
-- 전문서비스 주문의 "온라인 이용" 경량화 A안 — 앱 안에서 소통·진행공유·산출물(링크) 전달.
-- 발주=owner/expert, 공급=provider, 관리자 → deal_message의 message_sender_type(owner/expert/admin)에
-- provider가 없어 별도 enum 신설. 접근은 서버 액션이 adminClient(service-role)로 하고 앱 레벨 소유검증.

DO $$ BEGIN
  CREATE TYPE service_msg_sender AS ENUM ('owner', 'expert', 'provider', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS service_order_message (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_order_id uuid NOT NULL REFERENCES service_order(id) ON DELETE CASCADE,
  sender_type      service_msg_sender NOT NULL,
  sender_id        text NOT NULL,               -- owner/expert/provider=uuid, admin=email(관행)
  content          text NOT NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_order_message
  ON service_order_message (service_order_id, created_at);

ALTER TABLE service_order_message ENABLE ROW LEVEL SECURITY;
-- 정책 없음 = service-role만 접근(anon/authenticated 직접 차단). 발신자 스푸핑은 서버 액션의
-- 소유검증(owner_id/provider_id를 auth로 확인)으로 방어한다.
