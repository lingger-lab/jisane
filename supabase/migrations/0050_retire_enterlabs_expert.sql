-- 0050: 엔터랩스 완전 은퇴 — 잔존 엔터랩스 행(expert 대상 교육 3건) 지사네 공식 재배정 (멱등, 재실행 안전).
--
-- 배경: 0048은 target_audience='owner' 엔터랩스 행만 재배정했고 expert 대상은 "별도 판단"으로 남겨뒀다.
-- 이제 그 판단을 확정한다 — 남은 엔터랩스 행(교육 3건: AI 도구 워크숍·콘텐츠 파이프라인 과정·
-- 프롬프트 엔지니어링 기초)을 전부 지사네 공식(d0000002…)으로 옮긴다. 목적:
--   1) 공개 카드의 '엔터랩스' 제공자 라벨 → '지사네'로 정리(엔터랩스 아님 방침 일치).
--   2) 스튜디오 가드(.neq provider_id = ENTERLABS)를 벗어나 배너·노출·매칭을 스튜디오에서 관리 가능화.
-- slug는 전역 UNIQUE라 provider 변경만으로 충돌 없음. 적용 후 엔터랩스 제공 행 0건 기대.

UPDATE service_package
SET provider_id = 'd0000002-0000-0000-0000-000000000002'   -- JISANE_OFFICIAL_ID
WHERE provider_id = 'd0000001-0000-0000-0000-000000000001'; -- ENTERLABS_ID

-- 확인용: 아래가 0이어야 한다.
-- SELECT count(*) FROM service_package WHERE provider_id = 'd0000001-0000-0000-0000-000000000001';
