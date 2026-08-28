-- 0043: 지식서비스 배너 이미지 — additive, 재실행 안전
--
-- 서비스 카드/상세/공개 허브에 표시할 16:9 배너 이미지 URL.
-- Supabase Storage(service-banners 버킷)의 public URL을 저장한다. nullable — 없으면 폴백 렌더.
-- 이미지 업로드/버킷 생성은 별도(대시보드 또는 SQL) — docs/staging-setup.md 참조.

ALTER TABLE service_package
  ADD COLUMN IF NOT EXISTS banner_url text;   -- nullable, Storage public URL
