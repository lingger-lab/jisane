-- 0045: 스킬 동기화 — 노출 토글(visible) + axdashboard 출처 식별(source_ref). additive, 재실행 안전.
--
-- visible:    관리자 노출 on/off. 디폴트 노출(true). **동기화(syncEnterlabsSkills)는 이 컬럼을
--             절대 기입하지 않는다** → Supabase upsert가 미지정 컬럼을 보존하므로, 관리자가 off한
--             항목은 재동기화 후에도 off로 유지된다(관리자 소유 컬럼).
-- source_ref: 'axd:<skill uuid>' 형태. axdashboard에서 온 서비스의 출처·prune 판별자. 회원/엔터랩스
--             직접 등록 서비스는 NULL. 부분 유니크 인덱스로 중복 동기화를 차단(NULL 다중 허용).

ALTER TABLE service_package
  ADD COLUMN IF NOT EXISTS visible boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS source_ref text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_package_source_ref
  ON service_package (source_ref) WHERE source_ref IS NOT NULL;
