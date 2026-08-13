-- owner 랜딩 ①(기업 운영 전문 서비스) 노출 큐레이션:
-- 랜딩에는 featured(추천) 서비스만 표시하고, 나머지는 "전체 전문 서비스 둘러보기"(/services)에서 본다.
-- 유지(랜딩 노출) 3개: AX 무료 진단 · 사업계획서 작성 · 정부지원사업 신청대행.
-- 제외(랜딩 미노출) 3개: AX 전환 코칭 · AI 사업 진단 · 경영진단.
-- featured 컬럼은 기존 '추천 서비스' 강조에도 쓰이며 개념이 일치한다(services-view 배지·상세 eyebrow).
-- 재실행 안전(명시적 slug 집합 기준 설정).

UPDATE service_package
SET featured = (slug IN ('ax-diagnosis-free', 'biz-plan-writing', 'gov-subsidy-application'))
WHERE target_audience = 'owner';
