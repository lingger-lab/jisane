# 클로드코드 작업 지시서 — 지사네 DB 스키마 정합성 검토 + 재구축

> 이 문서는 Claude(설계자)가 클로드코드(구현자)에게 넘기는 인계서다.
> 지사네 플랫폼의 새 설계에 맞춰 DB 스키마를 정합성 있게 정리·생성한다.
> **동봉 문서 `지사네_매칭평가가격보증_설계.md`(v1.3)를 반드시 함께 읽고 작업할 것.**
> 이 지시서는 그 설계의 핵심 결정을 요약해 자체 완결성을 갖되, 세부 근거는 설계 문서를 참조한다.

---

## 0. 작업 목표

1. 프로젝트 폴더에서 **지사네(jisane) 스키마 파일을 탐색**한다.
2. 기존 스키마와 새 설계(설계 문서 v1.3) 사이의 **정합성을 검토**한다 (누락·사장·충돌 3분류).
3. 확정된 **용어 규칙**으로 전체를 통일한다.
4. 정합성 맞춘 **최종 스키마 SQL**과 **마이그레이션 노트**를 생성한다.

---

## 1. 먼저 할 일 — 지사네 스키마 파일 찾기

### 1.1 지사네 스키마를 식별하는 표식 (이것이 있으면 지사네)
```
client / partner / request / matching / deal / settlement
guarantee_fund_ledger (보증금 원장)
manager_name / escrow_status / workflow_step
category (약 175개) / partner_grade (veteran/standard/new)
```

### 1.2 제외할 파일 (지사네가 아님 — 절대 섞지 말 것)
```
이제남(ijenam) / 과일청 프로젝트:
  products / orders / order_items(engrave_name) / leads / events
  → 첫 줄 주석에 "이제남 (ijenam)"이 있으면 지사네 아님, 무시
```

### 1.3 탐색 방법
- 프로젝트 루트, `supabase/`, `migrations/`, `db/`, `schema/` 등을 뒤진다.
- `.sql` 파일들의 상단 주석과 테이블명을 확인해 지사네 것만 선별한다.
- **여러 스키마 파일이 있으면 전부 목록화**하고, 어느 것이 최신/정본인지 판단해 보고한다.
- 지사네 스키마 파일이 **없으면**(설계만 있고 미구현), 설계 문서 기준으로 **처음부터 생성**한다. 이 경우도 정상 경로다.

---

## 2. 용어 규칙 (확정 — 예외 없이 적용)

| 기존 | 새 표준 | 비고 |
|------|---------|------|
| client / 기업 / Owner | **owner** | 테이블명도 `owner`로 변경 (client 폐기) |
| partner / 시니어 / 전문가 | **expert** | **단수** 사용. 화면 표현은 "전문가" |
| manager / 관리자 / Admin | **admin** | manager_name → admin_name |
| 전문서비스 | **service** | provider(제공기관) → service(항목) |

### 2.1 단수/복수 규칙
- 테이블·컬럼·코드: **단수** (`expert`, `owner`) — 일관 적용.
- 화면 카피: "전문가"(한국어)로 표기. 코드의 `expert`와 표현의 "전문가"를 매핑.

### 2.2 gyeotae 처리
- `review_author` enum의 `gyeotae`(곁태, 제3자 평가)는 **`admin`으로 통합**한다.
- 즉 `review_author`: `client, partner, gyeotae` → **`owner, expert, admin`**.

### 2.3 연쇄 변경 (놓치면 정합성 깨짐)
```
partner            → expert
partner_category   → expert_category
partner_interest   → expert_interest
partner_grade      → expert_grade (enum)
partner_status     → expert_status (enum)
manager_name       → admin_name (enum: park, brad, kim)
client             → owner (테이블 + 모든 FK 참조)
review_author      → owner/expert/admin
/api/partner/*     → /api/expert/*
partner 참조 FK 전부 → expert
```

---

## 3. 반영할 새 설계 (설계 문서 v1.3 요약)

### 3.1 매칭 방식 — B안(기업 초빙) + AI 하이브리드
- owner가 카테고리 선택 → expert 리스트(≤10, 종합점수순) → **초빙**.
- AI 매칭 후보는 **축소 유지**(선택 피로 시 추천 보조). `matching_candidate` 테이블은 **삭제하지 말고 보조 역할로 유지**.
- 초빙이 새 출발점이므로 `request` 없이도 거래 성립 가능한 경로를 허용.

### 3.2 신규 테이블 (기존 17개에 없음 — 생성 필요)

```
expert (기존 partner 개편) — 필드 추가:
  hourly_rate         INT      시간당 단가 (10000~100000, 기준 25000)
  career_years        INT
  career_score        DECIMAL  경력점수 (가입 시 확정)
  review_score        DECIMAL  리뷰점수 (기본 3.0)
  completion_score    DECIMAL  완료율점수 (기본 3.0)
  total_score         DECIMAL  종합점수 = (career×1 + review×2 + completion×1)/4
  activity_points     DECIMAL  활동지표 (밴드·글, 종합점수와 별도)
  is_newbie           BOOL     리뷰 3건 미만 여부

owner (기존 client 개편) — 필드 추가:
  completed_deals     INT      거래 완료 건수 (점수 아님, 이력 뱃지용)

invitation (신규) — 초빙:
  id, owner_id FK, expert_id FK, request_id FK(선택적)
  status       ENUM(invited, accepted, declined)
  est_hours    INT             expert 예상 소요시간
  est_amount   INT             예상총액 = est_hours × hourly_rate
  cap_amount   INT             캡 (= est_amount, 예상액 고정)
  created_at
  ※ expert별 status='invited' 동시 5개 제한 (조정 가능한 설정값)

expert_activity (신규) — 밴드/게시글 가점:
  id, expert_id FK
  type         ENUM(band_join, post)
  points       DECIMAL
  approved_by  admin_name
  created_at, expires_at        (최근 3개월 유효)

provider (신규) — 전문서비스 제공기관:
  id, name, logo
  type ENUM(consulting, legal, tax, accounting, insurance)
  ※ 현재 엔터랩스 1개 row, 입점 시 row 추가

dispute (신규) — 이의제기 (사후 감사):
  id, target_type ENUM(review, settlement), target_id
  raised_by ENUM(owner, expert)
  reason TEXT, status ENUM(open, resolved)
```

### 3.3 기존 테이블 변경

```
service 테이블:
  + provider_id  FK   서비스를 기관에 연결 (현재 전부 엔터랩스)
  + is_free      BOOL 무료/유료 구분 (가입 전환 장치)

partner_interest → expert_interest:
  ※ 동시 활성 관심표현 5개 제한 (조정 가능한 설정값)
  ※ owner 마이페이지 + 의뢰 상세 양쪽에서 조회

guarantee_fund_ledger:
  + reason ENUM에 'newbie_guarantee' 추가 (신규자 보증 환불 추적)

자동화/사후감사 공통 필드 (🟡🟢 업무 테이블에):
  + auto_processed  BOOL
  + queue_status    ENUM(auto_passed, pending_review, audited)
  + audit_sampled   BOOL   무작위 감사 대상(5%) 추출 여부
```

### 3.4 가격·정산 규칙 (스키마 제약에 반영)
- 시간당 단가 10000~100000 (CHECK 제약).
- 캡 = 예상액 고정: 조기 완료해도 `cap_amount` 그대로 정산.
- 에스크로: settlement `pending→deposited→reviewing→released/refunded`.

### 3.5 평가점수 산정 (뷰 또는 트리거로 자동화)
```
career_score : 30년+5.0 / 20년+4.0 / 10년+3.0 / 5년+2.0 / 5년미만1.0
review_score : 리뷰0건→3.0 / 1건~→owner 별점 평균(admin 검수 후)
completion_score : 실적0건→3.0 / 1건~→완료율%×5
total_score = (career×1 + review×2 + completion×1) / 4
```

---

## 4. 정합성 검토 기준 (3분류로 보고)

기존 스키마와 새 설계를 대조해 아래 3가지로 분류·보고할 것:

```
[누락] 설계엔 있는데 기존 DB에 없음
  → invitation, provider, dispute, expert_activity, 위 신규 필드들

[사장] 기존 DB엔 있는데 설계가 안 씀
  → matching_candidate (B안 전환으로 역할 축소 — 삭제 말고 보조 유지)
  → manager_name 하드코딩 (admin_name enum으로 정리)

[충돌] 설계와 DB가 어긋남
  → request 중심 흐름 vs invitation 중심 흐름 (둘 다 허용하도록 조정)
  → deal_status vs 초빙 흐름의 상태 전이 정합성
  → review_author의 gyeotae → admin 통합
```

---

## 5. 참고할 품질 기준 (이제남 스키마 수준)

지사네와 무관한 프로젝트지만, **구현 완성도의 벤치마크**로 삼을 것. 특히:

```
트리거 자동화 (우리 설계의 "사람 관여 최소화"와 동일 철학):
  · order_no 자동생성 방식 → invitation 번호 등에 응용 가능
  · touch_updated_at() → 모든 테이블 updated_at 자동 갱신
  · order_to_lead() 처럼 이벤트 연쇄 자동화

분석 뷰:
  · verdict, funnel 처럼 관리자 대시보드용 집계 뷰
  → 지사네: expert total_score 집계 뷰, admin 대시보드 KPI 뷰

RLS 정책 (owner/expert/admin 권한 분리에 필수):
  · anon insert / authenticated all 패턴
  → 지사네: owner는 자기 request만, expert는 자기 profile만,
    admin은 전체 — 역할별 RLS 필수
```

---

## 6. 산출물

```
1. jisane_schema.sql — 최종 통합 스키마
   · Enums (새 용어) → Tables → Triggers → Views → RLS → Seed
   · 실행 순서 명시 (FK 의존성 고려)

2. MIGRATION_NOTES.md — 마이그레이션 노트
   · 기존 → 신규 변경점 전체 (테이블명·컬럼·enum)
   · 데이터 이전이 필요한 경우 이전 전략
   · 파괴적 변경(client→owner 등) 주의사항

3. 정합성 검토 보고 — 3분류(누락·사장·충돌) 결과
```

---

## 7. 주의사항 (인계 누락 방지)

이 결정들은 8단계 논의로 확정된 것이다. **임의로 바꾸지 말 것**:

- [ ] 신규자 콜드스타트 기본점수는 **3.0** (1.67 아님, 각 항목에 기본값 3.0)
- [ ] 점수 가중치는 **경력1 : 리뷰2 : 완료1 ÷ 4** (균등 아님)
- [ ] 캡은 **예상액 고정** (실비 정산 아님)
- [ ] gyeotae는 **admin으로 통합** (별도 유지 아님)
- [ ] client는 **owner로 테이블명까지 변경** (표현만 아님)
- [ ] expert는 **단수** (experts 아님)
- [ ] matching_candidate는 **삭제 말고 보조 유지** (완전 제거 아님)
- [ ] 5개 제한(관심표현·초빙)은 **하드코딩 금지, 설정값으로**
- [ ] 무료/유료(is_free)는 가입 전환 장치 — 서비스 카드에 구분 표시
- [ ] 두 경로(전문가 초빙 vs 서비스 구매)는 **완전 별개**로 유지

### 검증 한계 (반드시 인지)
- 이 지시서·설계 문서는 **문서 수준 정합성**만 보장한다.
- 실제 데이터 타입 불일치·인덱스·제약은 클로드코드가 실제 스키마와 대조해 확정해야 한다.
- 불명확한 기존 필드는 **추정하지 말고 "확인 필요"로 표시**해 보고할 것.

---

## 8. 작업 순서 (권장)

```
1) 지사네 스키마 파일 탐색·선별 (없으면 신규 생성 모드)
2) 설계 문서 v1.3 정독
3) 정합성 검토 → 3분류 보고 (사람 확인 대기)
4) 확인 후 → 용어 통일 + 최종 스키마 SQL 생성
5) 마이그레이션 노트 작성
6) 산출물 3종 제출
```

> **3단계에서 한 번 멈추고 보고할 것.** 정합성 검토 결과를 사람이 확인한 뒤 SQL 생성으로 넘어가는 게 안전하다. 특히 파괴적 변경(client→owner)과 matching_candidate 처리는 확인받고 진행.
