-- 0049: banner_url에 혼입된 공백·CR/LF 제거 (멱등, 재실행 안전).
--
-- 배경: NEXT_PUBLIC_SUPABASE_URL env 값 끝에 개행(\r\n)이 섞여 들어와, 서버가 조합한 배너 public URL
-- 중간(host 직후)에 \r\n이 박혔다. <img>/next-image의 src로는 잘못된 URL이라 이미지가 깨져 보였다.
-- 코드(publicUrlFor·isOwnBannerUrl·parseForm·ServiceBanner)는 정규화하도록 고쳤고, 이 마이그레이션은
-- 이미 저장된 값을 일괄 세정한다. URL은 공백을 포함하지 않으므로 모든 공백문자를 제거한다.

UPDATE service_package
SET banner_url = regexp_replace(banner_url, '\s', '', 'g')
WHERE banner_url ~ '\s';
