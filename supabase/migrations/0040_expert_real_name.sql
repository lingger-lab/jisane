-- 0040: 시니어지식인 실명(real_name) 컬럼 — additive, 재실행 안전
--
-- expert.name은 "활동명(공개 표시명)"으로 유지·분리하고, 실명은 별도 비공개 컬럼으로 수집한다.
-- 관리자가 실제 인물을 식별하기 위함. 등록/프로필 폼에서 필수 입력(앱 레이어 강제).
-- 기존 행 호환을 위해 NULL 허용으로 추가 — 필수화는 폼/서버액션에서 신규·수정 시 적용.

ALTER TABLE expert ADD COLUMN IF NOT EXISTS real_name text;

COMMENT ON COLUMN expert.real_name IS '실명(비공개 PII) — 본인·관리자만 열람. 공개 표시는 name(활동명) 사용';
