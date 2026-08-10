# 지사네 v2 마이그레이션 노트

> v1 (곁에/yourside MVP) → v2 (지사네 정식) 전환 기록
> 설계 문서 v1.3 + 클로드코드 지시서 기반

---

## 1. 파괴적 변경 (Breaking Changes)

### 1.1 테이블 rename

| v1 | v2 | 비고 |
|---|---|---|
| `client` | **`owner`** | 테이블명 + 모든 FK 참조 변경 |
| `partner` | **`expert`** | 테이블명 + 모든 FK 참조 변경 |
| `partner_category` | **`expert_category`** | partner_id → expert_id |
| `partner_interest` | **`expert_interest`** | partner_id → expert_id |

### 1.2 Enum rename

| v1 | v2 | 비고 |
|---|---|---|
| `client_status` | **`owner_status`** | 값 동일 (active, inactive) |
| `partner_status` | **`expert_status`** | 값 동일 (active, waiting, suspended) |
| `partner_grade` | **`expert_grade`** | 값 동일 (veteran, standard, new) |
| `manager_name` | **`admin_name`** | 값 동일 (park, brad, kim) |

### 1.3 Enum 값 변경

| enum | v1 값 | v2 값 |
|---|---|---|
| `review_author` | client, partner, gyeotae | **owner, expert, admin** |

### 1.4 FK 컬럼 rename

| 테이블 | v1 | v2 |
|---|---|---|
| request | `client_id` | **`owner_id`** |
| matching | `partner_id` | **`expert_id`** |
| deal | `partner_id` | **`expert_id`** |
| service_order | `client_id` / `partner_id` | **`owner_id`** / **`expert_id`** |

### 1.5 필드 rename

| 테이블 | v1 | v2 |
|---|---|---|
| expert (was partner) | `career_yrs` | **`career_years`** |
| deal_message | sender_type `'partner'/'client'` | sender_type **`'expert'/'owner'`** |

---

## 2. 신규 테이블 (5개)

| 테이블 | 용도 |
|---|---|
| **`invitation`** | B안 초빙 — owner가 expert를 직접 초빙 |
| **`expert_activity`** | 밴드/게시글 활동 가점 (3개월 유효) |
| **`provider`** | 전문서비스 제공기관 (2단 구조) |
| **`dispute`** | 이의제기 (사후 감사) |
| **`platform_config`** | 조정 가능한 설정값 (하드코딩 방지) |

---

## 3. 신규 필드

### expert (기존 partner에 추가)

| 필드 | 타입 | 설명 |
|---|---|---|
| `hourly_rate` | INT CHECK(10000-100000) | 시간당 단가 |
| `career_score` | NUMERIC(3,1) DEFAULT 3.0 | 경력점수 |
| `review_score` | NUMERIC(3,1) DEFAULT 3.0 | 리뷰점수 |
| `completion_score` | NUMERIC(3,1) DEFAULT 3.0 | 완료율점수 |
| `total_score` | NUMERIC(3,1) GENERATED | (경력×1+리뷰×2+완료×1)/4 |
| `activity_points` | NUMERIC(5,1) DEFAULT 0 | 활동지표 (종합점수와 별도) |
| `is_newbie` | BOOLEAN DEFAULT true | 리뷰 3건 미만 |

### owner (기존 client에 추가)

| 필드 | 타입 | 설명 |
|---|---|---|
| `completed_deals` | INT DEFAULT 0 | 거래 완료 건수 (뱃지) |

### service_order (기존에 추가)

| 필드 | 타입 | 설명 |
|---|---|---|
| `provider_id` | UUID FK→provider | 제공기관 연결 |
| `is_free` | BOOLEAN DEFAULT false | 무료/유료 구분 |

### deal (기존에 추가)

| 필드 | 타입 | 설명 |
|---|---|---|
| `invitation_id` | UUID FK→invitation | 초빙 경로 deal |
| `auto_processed` | BOOLEAN | 자동처리 여부 |
| `queue_status` | ENUM | auto_passed/pending_review/audited |
| `audit_sampled` | BOOLEAN | 감사 샘플 여부 |

### settlement, review (자동화 필드 추가)

auto_processed, queue_status, audit_sampled — deal과 동일 패턴

### guarantee_fund_ledger

| 변경 | 설명 |
|---|---|
| `entry_type` text → `guarantee_entry_type` enum | accrual, release, refund, **newbie_guarantee** |
| `updated_at` 추가 | 트리거 연동 |

---

## 4. 신규 Enum 타입

| 타입 | 값 |
|---|---|
| `invitation_status` | invited, accepted, declined |
| `dispute_status` | open, resolved |
| `dispute_target_type` | review, settlement |
| `provider_type` | consulting, legal, tax, accounting, insurance |
| `expert_activity_type` | band_join, post |
| `queue_status` | auto_passed, pending_review, audited |
| `guarantee_entry_type` | accrual, release, refund, newbie_guarantee |

---

## 5. 유지 (삭제하지 않은 테이블)

| 테이블 | 상태 | 사유 |
|---|---|---|
| `matching` | 보조 유지 | AI/관리자 매칭 경로 (A안 공존) |
| `matching_candidate` | 보조 유지 | AI 추천 후보 |
| `review_ai_suggestion` | 유지 | AI 평가 보조 |

---

## 6. 설정값 (platform_config)

| key | value | 설명 |
|---|---|---|
| max_active_interests | 5 | 전문가 동시 관심표현 최대 |
| max_active_invitations | 5 | 전문가 동시 초빙 최대 |
| newbie_review_threshold | 3 | 신규자 리뷰 건수 기준 |
| audit_sample_rate | 0.05 | 무작위 감사 추출률 |
| default_hourly_rate | 25000 | 기본 시간당 단가 |

---

## 7. 마이그레이션 전략

테스트 데이터만 존재 → **full reset** 채택:
- `0019_v2_full_reset.sql`: DROP ALL + 새 스키마 생성
- `0020_v2_seed.sql`: 새 용어 기반 seed (owner/expert)

`supabase db reset` 한 번으로 v2 스키마 + seed 데이터 완성.

---

## 8. 정합성 검토 결과 (3분류)

### [누락] 설계에 있고 v1에 없었음 → v2에서 추가

- invitation 테이블
- expert_activity 테이블
- provider 테이블
- dispute 테이블
- platform_config 테이블
- expert 점수 필드 7개
- owner.completed_deals
- service_order.provider_id, is_free
- 자동화 필드 (auto_processed, queue_status, audit_sampled)
- guarantee_entry_type enum (newbie_guarantee 포함)

### [사장] v1에 있고 설계에서 역할 축소 → 보조 유지

- matching 테이블 (AI 추천 보조)
- matching_candidate 테이블 (보조)
- review_ai_suggestion (관리자 검수 보조)
- manager_name → admin_name으로 rename
- gyeotae → admin으로 통합

### [충돌] 설계와 v1 어긋남 → 해결

- client→owner: 전면 rename
- partner→expert: 전면 rename
- 매칭 흐름: request→matching (A안) + invitation (B안) 공존
- 가격: budget_hope (A안 유지) + cap_amount (B안 invitation)
- review_author 값: client/partner/gyeotae → owner/expert/admin
