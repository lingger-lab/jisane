-- 0038: 시니어지식인 100인 초빙 이벤트 — 추천 접수 + 발표 공지 (additive, 재실행 안전)
--
-- 현금 지급 이벤트라 크레딧 원장(0031)과 무관한 독립 접수 테이블. 접수·조회·수정은
-- 서버 액션이 service-role(adminClient)로 수행하므로 RLS는 잠가둔다(공개 정책 없음).

DO $$ BEGIN
  CREATE TYPE event_referral_status AS ENUM ('submitted', 'valid', 'paid', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 추천 접수
CREATE TABLE IF NOT EXISTS event_referral (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_code       text NOT NULL DEFAULT 'senior100',
  referrer_name    text NOT NULL,                       -- 추천인(지급 대상 본인)
  referrer_contact text NOT NULL,                       -- 연락처
  referrer_email   text,
  referee_name     text NOT NULL,                       -- 추천한 분
  referee_contact  text NOT NULL,
  note             text,
  status           event_referral_status NOT NULL DEFAULT 'submitted',
  admin_memo       text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_referral_browse
  ON event_referral (event_code, status, created_at DESC);

ALTER TABLE event_referral ENABLE ROW LEVEL SECURITY;
-- (정책 없음 = service-role만 접근. anon/authenticated 직접 접근 차단)

-- 발표 공지 (이벤트당 1행, 관리자 편집 → 공개 페이지 배너)
CREATE TABLE IF NOT EXISTS event_notice (
  event_code text PRIMARY KEY DEFAULT 'senior100',
  body       text,
  published  boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE event_notice ENABLE ROW LEVEL SECURITY;

-- 공지 기본 행 시드(미게시 상태) — upsert 대상 존재 보장
INSERT INTO event_notice (event_code, body, published)
VALUES ('senior100', NULL, false)
ON CONFLICT (event_code) DO NOTHING;
