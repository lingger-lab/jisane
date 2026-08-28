-- 0047: 거래 라이프사이클 보강 — 산출물 전달(레일A) + 작업 제출 시각(레일B). additive, 재실행 안전.
--
-- service_order.deliverable_* : 카탈로그 주문의 '작업물 전달'을 링크+메모 1건으로 추적(무료기간 §0,
--   PG·Storage 신설 없이 경량). 공급자가 processing 단계에서 전달, 완료 처리의 선행조건이 된다.
-- deal.work_submitted_at      : 시니어(전문가)의 '작업 제출' 시각. 기존 quoted|working|done enum·CAS
--   로직에 무영향한 additive 타임스탬프(status enum 확장 대신). submitWork no-op 해소용.

ALTER TABLE service_order
  ADD COLUMN IF NOT EXISTS deliverable_url  text,
  ADD COLUMN IF NOT EXISTS deliverable_note text,
  ADD COLUMN IF NOT EXISTS delivered_at     timestamptz;

ALTER TABLE deal
  ADD COLUMN IF NOT EXISTS work_submitted_at timestamptz;
