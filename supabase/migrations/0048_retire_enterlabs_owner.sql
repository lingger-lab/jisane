-- 0048: 엔터랩스 은퇴 — 잔존 엔터랩스 owner 지식서비스를 지사네 공식으로 재배정(멱등, 재실행 안전).
--
-- 배경: axdashboard 동기화 은퇴로 sync 내부에 있던 ENTERLABS→JISANE 재배정 경로가 사라졌다.
-- 이 일회성 UPDATE로 남은 엔터랩스 owner 행을 전부 지사네 공식(d0000002…)로 옮겨 스튜디오 단일
-- 관리에 편입한다. slug는 전역 UNIQUE라 provider 변경만으로 충돌 없음.

UPDATE service_package
SET provider_id = 'd0000002-0000-0000-0000-000000000002'   -- JISANE_OFFICIAL_ID
WHERE provider_id = 'd0000001-0000-0000-0000-000000000001'  -- ENTERLABS_ID
  AND target_audience = 'owner';

-- 확인용: 아래가 0이어야 한다(expert 잔존 시 별도 판단).
-- SELECT count(*) FROM service_package WHERE provider_id = 'd0000001-0000-0000-0000-000000000001';
