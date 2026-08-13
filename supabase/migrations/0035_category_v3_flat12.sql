-- 카테고리 체계 재편: 7 대분류×중·소분류(175) → 평면 12분류.
-- 배경: expert_category(77)·request.category_id(50)는 전부 중분류(depth 1)만 참조하고
--       소분류(depth 2·140)는 미사용. 소분류 폐기, 중분류 28→새 12로 재매핑.
-- 안전: 트랜잭션 내 remap(참조 이전) 후 old 삭제(CASCADE로 mid·sub 정리).
--       새 slug가 기존 중분류 slug(legal/marketing/quality 등)와 충돌하므로,
--       임시 '-v3' slug로 삽입 → old 삭제 후 최종 slug로 정리한다.
-- 재실행 안전: 새 slug가 이미 있으면 삽입 건너뜀.

BEGIN;

-- 1) 새 평면 12 대분류(depth 0) — 임시 '-v3' slug(충돌 회피)
INSERT INTO category (id, parent_id, depth, label, slug, sort_order)
SELECT gen_random_uuid(), NULL, 0, v.label, v.slug, v.ord
FROM (VALUES
  ('경영·전략','strategy-v3',1),
  ('재무·회계','finance-v3',2),
  ('마케팅·브랜딩','marketing-v3',3),
  ('영업·사업개발','sales-v3',4),
  ('인사·조직','hr-v3',5),
  ('AI·디지털','ai-v3',6),
  ('생산·품질','quality-v3',7),
  ('R&D·기술','tech-v3',8),
  ('법률·정책','legal-v3',9),
  ('창업·스타트업','startup-v3',10),
  ('교육·코칭·리더십','education-v3',11),
  ('문서·행정','docs-v3',12)
) AS v(label, slug, ord)
WHERE NOT EXISTS (SELECT 1 FROM category c WHERE c.slug = v.slug);

-- 2) 옛 중분류(depth 1) label → 새 slug 매핑
CREATE TEMP TABLE _catmap (old_label text PRIMARY KEY, new_slug text) ON COMMIT DROP;
INSERT INTO _catmap (old_label, new_slug) VALUES
  ('창업코칭','startup-v3'),
  ('사업계획서','strategy-v3'),
  ('정부자금·보조금','strategy-v3'),
  ('경영진단','strategy-v3'),
  ('AI진단','ai-v3'),
  ('AEO최적화','ai-v3'),
  ('업무자동화','ai-v3'),
  ('데이터분석','ai-v3'),
  ('웹개발','ai-v3'),
  ('제안서·기획서','docs-v3'),
  ('보고서','docs-v3'),
  ('매뉴얼·가이드','docs-v3'),
  ('번역·통역','docs-v3'),
  ('품질관리','quality-v3'),
  ('생산관리','quality-v3'),
  ('ISO·인증','quality-v3'),
  ('안전관리','quality-v3'),
  ('R&D 기획','tech-v3'),
  ('기술개발','tech-v3'),
  ('특허·지식재산','tech-v3'),
  ('기술이전·사업화','tech-v3'),
  ('세무·회계','finance-v3'),
  ('법무','legal-v3'),
  ('노무','hr-v3'),
  ('마케팅','marketing-v3'),
  ('디자인','marketing-v3'),
  ('영상제작','marketing-v3'),
  ('콘텐츠제작','marketing-v3');

-- old 중분류 id → 새 대분류 id
CREATE TEMP TABLE _idmap (old_id uuid PRIMARY KEY, new_id uuid NOT NULL) ON COMMIT DROP;
INSERT INTO _idmap (old_id, new_id)
SELECT oldc.id, newc.id
FROM category oldc
JOIN _catmap m ON m.old_label = oldc.label AND oldc.depth = 1
JOIN category newc ON newc.slug = m.new_slug AND newc.depth = 0;

-- 3) expert_category 재매핑 (복합 PK — 중복 배정 dedup 위해 clear 후 distinct 재삽입)
CREATE TEMP TABLE _ec_new ON COMMIT DROP AS
SELECT DISTINCT ec.expert_id, im.new_id AS category_id
FROM expert_category ec JOIN _idmap im ON im.old_id = ec.category_id;

DELETE FROM expert_category;
INSERT INTO expert_category (expert_id, category_id)
SELECT expert_id, category_id FROM _ec_new;

-- 4) request.category_id 재매핑 (단일 FK — 직접 UPDATE, null은 그대로)
UPDATE request r SET category_id = im.new_id
FROM _idmap im WHERE r.category_id = im.old_id;

-- 5) 옛 카테고리 전부 삭제 (새 12 '-v3' 외 전부). 참조는 위에서 이전됨.
DELETE FROM category
WHERE slug NOT IN ('strategy-v3','finance-v3','marketing-v3','sales-v3','hr-v3','ai-v3','quality-v3','tech-v3','legal-v3','startup-v3','education-v3','docs-v3');

-- 5b) 최종 slug 정리 ('-v3' 제거) — old 삭제 후라 충돌 없음
UPDATE category SET slug = left(slug, length(slug) - 3) WHERE slug LIKE '%-v3';

-- 6) 검증 — 실패 시 트랜잭션 롤백
DO $$
DECLARE
  n_cat int; n_bad_ec int; n_bad_req int;
BEGIN
  SELECT count(*) INTO n_cat FROM category;
  IF n_cat <> 12 THEN
    RAISE EXCEPTION '카테고리 수가 12가 아님: %', n_cat;
  END IF;
  IF EXISTS (SELECT 1 FROM category WHERE depth <> 0) THEN
    RAISE EXCEPTION '평면(depth 0)이 아닌 카테고리 존재';
  END IF;
  IF EXISTS (SELECT 1 FROM category WHERE slug LIKE '%-v3') THEN
    RAISE EXCEPTION 'slug 정리 누락(-v3 잔존)';
  END IF;
  SELECT count(*) INTO n_bad_ec FROM expert_category ec
    LEFT JOIN category c ON c.id = ec.category_id WHERE c.id IS NULL;
  IF n_bad_ec > 0 THEN
    RAISE EXCEPTION 'expert_category 고아 참조: %', n_bad_ec;
  END IF;
  SELECT count(*) INTO n_bad_req FROM request r
    LEFT JOIN category c ON c.id = r.category_id
    WHERE r.category_id IS NOT NULL AND c.id IS NULL;
  IF n_bad_req > 0 THEN
    RAISE EXCEPTION 'request 고아 참조: %', n_bad_req;
  END IF;
END $$;

COMMIT;
