# 16. 수익모델 전환 설계 — 구독 + 도구 카탈로그 + 추천 (2026-08-12)

> docs/15(수익모델 확정 방향)의 **후속 상세 설계**. 매칭비(거래 수수료) 폐지 → **구독(기업 월 18,000원 /
> 시니어 월 9,000원, VAT 별도) + 파트너 유료 도구·서비스 매출 20% 커미션 + 추천/거래보증 크레딧** 모델로 전환.
> **설계 문서만** — 구현은 결제관계(PG/빌링) 설정 확정 후, docs/14의 P1-9/P1-17과 **동일 배포 단위·선행 의존**(HARD-GATE).
> 감사 P3-17·P2-11은 docs/15에서 "대체"로 이관. 상세 설계·리팩토링 리스크·UI/UX 고급화는 fable5가 코드베이스 순차 검증으로 작성.
>
> **구현 모델 정책(하이브리드)**: 금전·동시성·보안·마이그레이션 크리티컬 + 적대적 검증은 **fable5**(최상위 추론), UI/카피/스캐폴딩은 **주력(Opus 4.8)**(§9-A).

기준 코드 상태: 최신 마이그레이션 `supabase/migrations/0029_public_schema_grants.sql`. 신규는 **0030부터 additive-only**.

---

## 1. 자금·크레딧 흐름도

### 1.1 거래 1건 (예시: 시니어 설정 작업비 W = 1,000,000원)
파생은 단일 소스 `calcDealPricing`(§8.2 신설)에서만 산출.

| 항목 | 산식 | 예시(W=1,000,000) | 저장 |
|---|---|---|---|
| 작업비 W | 시니어(expert) 설정 | 1,000,000 | `deal.work_fee`(의미 유지) |
| 크레딧 보류분(기업부담 5%) | `round(W×0.05)` | 50,000 | `settlement.credit_hold_amt`(신규) |
| **기업 결제액(작업가격)** | `W + 보류분` — **단일 가격만 표시** | **1,050,000** | `deal.total_pay`(의미 재정의) |
| 결제수수료 충당(3.5%) | `round(W×0.035)` | 35,000 | `settlement.pg_fee_amt`(신규, **UI 비표시**) |
| 위험적립(1%) | `round(W×0.01)` | 10,000 | `settlement.risk_reserve_amt`(신규, **UI 비표시**) |
| **시니어 수령액** | `W − pg_fee − risk_reserve`(잔여식 — 반올림 오차 흡수) | **955,000** | `settlement.expert_payout_amt`(신규) |
| 매칭비 | **항상 0**(컬럼 유지, 제거 아님) | 0 | `deal.match_fee=0` |

**불변식**: `total_pay = expert_payout_amt + pg_fee_amt + risk_reserve_amt + credit_hold_amt` (1,050,000 = 955,000+35,000+10,000+50,000 ✓)

```
기업 ─(Toss 1,050,000)→ 에스크로(settlement pending→deposited)
   … deal_workflow 5단계 … deal.status='done' + reviewing 3일 → released (기존 auto-settlement, P1-17 RPC로 원자화)
      ├─ 시니어 지급 955,000
      ├─ PG 충당 35,000(플랫폼 보유, 실PG비 상계)
      ├─ 위험적립 10,000 → guarantee_fund_ledger('risk_reserve')
      └─ 크레딧 보류 50,000 (credit_state='holding', due_at = released_at+30일)
            ├[무분쟁 30일] credit_ledger 기업앞 +50,000(earn_deal_hold, 만료 6개월), state='released_to_credit'
            └[분쟁] 보류분(+부족 시 guarantee_fund)으로 복구 집행 → 잔여만 적립/소멸, state='consumed_dispute'
```
플랫폼 거래 순익 ≈ 0(보유 95,000 중 50,000 크레딧 부채·10,000 위험적립·35,000 실PG 상계). *메모: 3.5%는 W 기준, 실PG비는 결제액 기준 → 건당 약 −1,750원 미세 적자, §10 기록.*

### 1.2 구독 청구(월)
```
가입: 구독 UI → Toss 빌링키 발급(§3.1) → billing_key 저장 → subscription(active) → 즉시 1회차 invoice 청구 → 세금계산서 대상 기록
매월: cron billing-run → next_billing_at 도래분 → invoice(issued) → chargeBillingKey(멱등키=orderId) → 성공 시 기간연장 / 실패 즉시 past_due+고지, 재시도 D+1/3/7
```
- 기업 18,000+VAT=**19,800/월**, 시니어 9,000+VAT=**9,900/월**. **세금계산서는 구독 invoice에만**(§7). 작업비 1,050,000은 기업↔시니어 문제 — 플랫폼은 지급대행.

### 1.3 크레딧
```
적립: ① 거래 5% 보류 해제(earn_deal_hold) ② 추천 확정(earn_referral)
사용: 플랫폼 유료 상품·서비스만 — paid service_order·paid program_run. ❌구독 invoice 사용 불가(코드 차단 §5.2)
만료: 적립+6개월. D-30/D-7 통지 → 초과 시 'expire' 상쇄(행 삭제 없음). 환불·현금화 불가.
```

---

## 2. 데이터 모델

### 2.1 신규 enum
```
subscriber_type('owner','expert') · subscription_status('active','past_due','canceled','expired')
billing_key_status('active','removed') · invoice_type('subscription','commission')
invoice_status('draft','issued','paid','failed','void') · credit_holder_type('owner','expert')
credit_entry_type('earn_deal_hold','earn_referral','spend','expire','revoke','adjust')
credit_state('none','holding','released_to_credit','consumed_dispute')  -- settlement용
referral_status('pending','qualified','rewarded','rejected')
service_access_type('free','subscription','paid') · program_run_status('started','completed','failed')
program_access_mode('free','trial','subscription','paid','credit')
```

### 2.2 신규 테이블 (DDL 스케치)
**subscription_plan** — id·code UNIQUE·audience(subscriber_type)·price_monthly int(공급가)·status. 시드 owner_basic/18000, expert_basic/9000.
**billing_key** — subscriber_type·subscriber_id·customer_key UNIQUE(Toss)·toss_billing_key·card 마스킹메타·status. 부분UNIQUE(subscriber, WHERE active). **RLS 정책 0(service_role 전용)**.
**subscription** — plan_id·subscriber(type,id)·billing_key_id·status·current_period_start/end·next_billing_at·past_due_since·fail_count·canceled_at. 부분UNIQUE(subscriber WHERE active|past_due).
**invoice**(구독+커미션 겸용) — invoice_type·(subscription_id XOR provider_id, CHECK)·period·amount_supply/vat/total(`calcVat` 재사용)·status·order_id UNIQUE·payment_key·attempt_count·next_retry_at·tax_invoice_issued_at. UNIQUE(subscription_id, period_start) 멱등.
**credit_ledger**(append-only 화폐 원장) — holder(type,id)·entry_type·amount(±)·balance_after·expires_at(earn만)·remaining(earn FIFO)·settlement_id/referral_id/service_order_id/program_run_id/source_entry_id·note. UNIQUE(settlement_id WHERE earn_deal_hold).
**referral** — code·referrer(type,id)·referee(type,id)·status·qualified_at/rewarded_at·reward_ledger_id·rejected_reason. UNIQUE(referee) 어뷰징가드. + owner/expert에 `referral_code text UNIQUE`.
**program_run**(usage) — service_package_id·runner(type,id)·access_mode·service_order_id·billed_amount·status·result_url·시각. 인덱스(package,시각)/(runner,package,시각).

### 2.3 기존 테이블 변경(additive)
- **deal**: `pricing_model text DEFAULT 'subscription_v2'`(기존 백필 'match_fee_v1' — grandfather 단일판별). work_fee=W 유지, match_fee=0, total_pay=W×1.05 의미 재정의.
- **settlement**: `expert_payout_amt·pg_fee_amt·risk_reserve_amt·credit_hold_amt`(NOT NULL DEFAULT 0)·`credit_state`·`credit_release_due_at`. guarantee_fee는 legacy 전용.
- **guarantee_fund_ledger**: enum에 'risk_reserve'·'credit_recovery' 추가. auto-settlement 적립 소스 guarantee_fee→risk_reserve_amt.
- **service_package**: `access_type service_access_type DEFAULT 'paid'`(is_free 행→'free'), `trial_scope jsonb`(provider가 정하는 체험범위), tool 메타. 계획 도구=access_type 'subscription'. 시니어 제공 도구=provider.kind='senior' → 20% 동일.
- **dispute**: `resolution·admin_notified_at·owner_agreed_at·expert_agreed_at·executed_at`(중간단계는 timestamp, enum 비가역이라 회피).
- **platform_config**: work_price_markup 0.05·expert_pg_fee 0.035·expert_risk_reserve 0.01·credit_hold_days 30·credit_expiry_months 6·통지일[30,7]·referral_reward_*(미확정)·billing_retry[1,3,7]·expire_after 30·commission_rate 0.20.

### 2.4 RLS
billing_key=정책0. subscription·invoice·credit_ledger·referral·program_run=본인 SELECT만(`auth_user_id=auth.uid()` 서브쿼리, 0019 owner/expert_select_own 패턴). write는 서버(adminClient). provider 자가 write 금지(0027 원칙).

---

## 3. 구독 빌링
**3.1 발급**: 구독 페이지(owner/expert `(main)/subscription` 신설)에서 Toss 위젯 `requestBillingAuth(customerKey)` → successUrl authKey → 서버 `POST /v1/billing/authorizations/issue`로 billingKey 교환 → billing_key upsert → subscription 생성 → 즉시 1회차 청구. (지시서의 `/authorizations/card` 카드직수취는 PCI 부담 → 위젯+issue 권장, §10.)
**3.2 payment.ts 확장**: `issueBillingKey(authKey,customerKey)`·`chargeBillingKey(billingKey,{customerKey,amount,orderId,orderName})`=`POST /v1/billing/{billingKey}`. confirmPayment의 **throw 안 함·Idempotency-Key** 계약 준용. **orderId 주의**: 현 `parseOrderId`가 `parts[1]`을 dealId로 오인 → `buildOrderId/parseOrderId`를 `{kind:'deal'|'subscription',id}`로 확장, 웹훅 디스패치 kind 분기(기존형식 'deal' 하위호환).
**3.3 cron**: `apps/admin/app/api/cron/billing-run` + vercel.json(auto-release/activity-expiry와 병렬). next_billing_at/next_retry_at 도래분 → invoice 멱등 생성 → charge → 성공 CAS(issued→paid)+기간+1개월 / 실패 즉시 past_due+고지, 재시도[1,3,7], 최종실패+30일 → expired. 이중실행에도 invoice 1행. 웹훅은 보조 대사.
**3.4 해지**: canceled_at 기록, 기간말까지 유지 후 canceled.

---

## 4. 도구 카탈로그·엔타이틀먼트
**4.1 게이트**(신규 `packages/shared/lib/entitlement.ts` `getEntitlement`):

| access_type | 비구독 | 구독 active | past_due |
|---|---|---|---|
| free | ✅(메인 진입 항상 허용) | ✅ | ✅ 진입만, 추가진행 ❌ |
| subscription | 🔶 체험만(provider `trial_scope` 한도, program_run trial 카운트) | ✅ | ❌ |
| paid | 💳 구매(service_order → 결제 or **크레딧 차감**) | 💳 | 💳 |

모든 실행=program_run 1행(access_mode). 체험범위는 **provider가 파트너 대시보드에서 설정**(publish 게이트 0027 유지).
**4.2 파트너 20% 커미션**: 월별 `0.20 × Σ paid 매출`(① service_order paid/completed·is_free=false, provider 귀속은 0026 FK ② program_run.billed_amount paid|credit·completed). **크레딧 결제 매출도 대상**(파트너엔 동일 매출, 플랫폼이 부채 정산). 월초 cron이 provider별 invoice(commission, issued) 생성 → **인보이스 청구**(자동결제 아님). UNIQUE(provider,period). *현 service_order 결제 미연동(수기 paid 전환) → 유료 도구 결제수단 확정 시(§10) 통일.*

---

## 5. 크레딧 원장
**5.1 적립**: 거래 5%=cron `credit-hold-release`(due_at 경과 & open dispute 없음 → earn_deal_hold + state CAS; dispute 체크는 auto-settlement fail-closed 준용). 추천=§6. earn 행 expires_at=+6개월, remaining=amount.
**5.2 사용**(FIFO, 원자적): `service_order_id` 또는 `program_run_id` 중 하나 필수(CHECK) → **구독 invoice 참조 불가=구조적 차단**. 차감은 **Postgres RPC 단일 트랜잭션**(P1-9 철학): 미만료 lot을 created_at ASC `FOR UPDATE`로 잠그고 remaining 차감+spend 기입. 잔액부족 0행→409.
**5.3 만료·통지**: cron `credit-expiry`가 만료 lot에 **상쇄 expire 기입**(행 삭제 금지). 통지 D-30/D-7. (발송 인프라 없음 → §7.2 SMS 어댑터+인앱, §10.)
**5.4 불변식**: balance=Σamount=마지막 balance_after · Σremaining=balance · earn_deal_hold settlement당 1행 · spend≤연결 매출 · 크레딧 부채총계=Σremaining(관리자 부채 대시보드).

---

## 6. 추천 시스템
- **코드**: 가입 완료 시 owner/expert에 referral_code(짧은 base32 UNIQUE). URL `?ref=CODE`→쿠키→OAuth 콜백 회원생성 시 referral(pending).
- **확정(qualified)**: referee의 ① 첫 구독 invoice paid 또는 ② 첫 settlement released — 먼저 도달. billing-run/auto-release 후처리에서 CAS.
- **지급**: qualified→earn_referral 기입+rewarded. 금액=platform_config(미확정 §10).
- **어뷰징가드**: UNIQUE(referee) 1회 · 자기추천 차단(auth_user_id·email·contact 대조) · **선지급 없음**(유료전환/거래확정 후) · 관리자 검수큐(queue_status 패턴, 이상패턴 rejected) · revoke(확정전 환불/해지 시 상쇄).

---

## 7. 분쟁·연체
**7.1 분쟁 상태기계**(5% 보류창 내):
```
credit_state='holding'(released+30일창) → dispute(open, target='settlement')
 → [관리자 SMS 고지 admin_notified_at] → 관리자가 양자 고지 → owner_agreed_at/expert_agreed_at
 → 양자 OK → 관리자 최종고지·집행(executed_at,resolution): 보류분 내 복구→잔여만 적립 / 부족분→guarantee_fund('credit_recovery')
 → resolved · credit_state='consumed_dispute' 또는 'released_to_credit'
```
open dispute면 credit-hold-release cron 스킵(auto-settlement eligible 필터 구조). **SMS**: `packages/shared/lib/notify/sms.ts` 신설(솔라피/알리고, 키주입 시 활성 게이트=isPaymentEnabled 패턴).
**7.2 접근제한 매트릭스**(역할×past_due×리소스):

| 리소스 | owner past_due | expert past_due | expert 미구독 |
|---|---|---|---|
| 무료 S/W 메인(free) | ✅ 진입, 추가진행❌ | ✅ 진입만 | ✅ |
| 구독 도구 | ❌ | ❌ | 🔶 체험 |
| 시니어 데이터 열람 | **✅ 허용** | – | – |
| 의뢰 리스트 열람 | – | **✅ 허용** | ✅ |
| 작업진행 데이터(status/work) | **❌ 제한** | **❌ 제한** | ✅ |
| 매칭 데이터 | – | **❌ 제한** | ✅ |
| 신규 의뢰/초빙 생성·수락 | ❌ | ❌ | ✅ |

각 앱 `(main)` 진입부에서 `getEntitlement` 서버검증(미들웨어 아님). **진행 중 거래의 에스크로 정산은 제한 안 함**(자금 볼모 금지, 열람 UI만 제한).

---

## 8. 매칭비 폐지·공존 마이그레이션
**8.1 Grandfather**: `deal.pricing_model='match_fee_v1'` 거래는 기존 산식·표시·정산 그대로 완결(판별은 이 컬럼만). `calcMatchFee/calcGuaranteeFee`는 **삭제 금지·@deprecated 유지**(legacy 렌더).
**8.2 코드 변경 목록**:
- `pricing.ts`: `calcDealPricing(workFee)` 신설(§1.1), 매칭비 산식 deprecated, calcVat/calcPayableAmount는 구독 invoice 재사용.
- `cap-pricing.ts`: 내부 calcDealPricing로 교체(matchFee=0, totalPay=W×1.05). 최소작업비 3만원 throw 유지 여부 §10.
- 거래생성 2경로 `apps/expert/lib/matching/actions.ts`·`invitation/actions.ts`: 금액 산출→calcDealPricing, match_fee=0, settlement 신규 4필드, pricing_model='subscription_v2'.
- `confirm-deposit.ts`: v2 작업비 VAT 부과 여부 §10(pricing_model 분기).
- `auto-settlement.ts`·`admin/lib/admin/actions.ts`(수동 release): 적립 소스 risk_reserve_amt로, credit_release_due_at 세팅, **P1-17 RPC에 병합**.
- **표시(공제 세부 숨김)**: owner quote-section(합계+"5% 적립·크레딧 안내")·settlements API(pg_fee/risk_reserve 비노출)·expert 화면(work_fee 기준)·견적/명세서(매칭비 행 삭제→작업가격 단일+크레딧 안내).
- **공개 카피**(확정 문구 후): 3앱 랜딩·standard/page·guarantee·scope(7구간표 전체)·service/page.
- **관리자 내부 화면**(숨김 비적용): progress-tab·settlement-tab v1/v2 분기.
- database.types/query-types 재생성.
**8.3 순차**: 0030+ additive(enum→테이블→컬럼→백필→RLS→config) → 타입재생성 → pricing 신함수+테스트 → 거래생성 2곳 → 정산·표시 → 공개카피 → legacy 코드 유지.

---

## 9. 단계적 구현 로드맵 (전제: PG/빌링 계약 확정 후, P1-9/17 RPC와 한 배포단위)

| Phase | 산출물 | 마이그 | DoD |
|---|---|---|---|
| 0 기반 | enum·테이블·컬럼·config 시드, 타입재생성, calcDealPricing+테스트 | 0030/0031 | fresh reset+순차 양쪽 통과, 백필 분포 검증, 불변식 단위테스트 |
| 1 구독빌링 | payment.ts 확장(orderId kind), 구독 UI, billing-run cron, past_due 게이트, 세금계산서 대상 | 0032 | Toss **테스트키** 발급→청구→실패→재시도→past_due→복귀, cron 이중실행 invoice 1행, orderId 하위호환 |
| 2 도구·커미션 | access_type/trial_scope, entitlement.ts, program_run, 파트너 trial UI, commission invoice cron | (0) 포함 | 게이트 매트릭스 전셀 e2e, 체험한도 차단, 월커미션 수기일치 |
| 3 거래흐름+크레딧 | deal 2경로 전환, settlement 신필드, credit-hold-release/expiry cron, spend RPC, 분쟁+SMS, 견적/명세 재구성 | 0033(P1-9/17 RPC 통합) | W=100만 4분해 일치, 분쟁 시 release 스킵(fail-closed), 크레딧 이중적립 불가, 만료후 잔액=Σremaining |
| 4 추천 | referral_code, 콜백연동, qualified 후처리, 검수큐 | 0034 | 자기추천 차단·1회·선지급 없음 |
| 5 카피·마감 | 공개 재작성(확정문구), legacy 문서 유지 확인 | – | 매칭비 grep 0건, legacy deal 렌더 회귀 없음 |

**리스크·엣지**: ① 결제성공↔DB실패 창=멱등 계약+Idempotency-Key 흡수 ② 크레딧 spend 경합=RPC FOR UPDATE 직렬화 ③ 월말일 anchor 클램프 규칙 ④ 보류창 중 환불(P1-9) 경합=refunded settlement는 credit_state='none' ⑤ past_due 중 진행거래 정산 계속 ⑥ 크레딧 결제 매출의 파트너 현금정산=부채 대시보드.

---

## 9-A. 구현 모델 정책 (하이브리드 — 2026-08-12 확정, 배정 정정)
> **모델 위계(claude-api 레퍼런스 확인)**: Fable 5(`claude-fable-5`)가 "가장 유능한 광범위 출시 모델 — 가장 까다로운 추론·장기 에이전트 작업용"(가격 $10/$50), Opus 4.8은 "Opus 티어 최상위"($5/$25, Fable의 하위 티어). **어려운 추론일수록 Fable 5.** (초기안은 배정이 반대였음 — 정정)
- **fable5 (최상위 추론) + 적대적 검증**: 금전·동시성·보안·마이그레이션 크리티컬 — pricing 단일소스(§11.1), 크레딧 원장·RPC(§5·§11.5), 빌링 멱등·orderId(§3·§11.4), 정산 원자성(P1-17)·환불↔적립 clawback(§11.6), RLS·billing_key(§2.4·§11.7), 모든 0030+ 마이그레이션. → §11 실패모드가 치명이라 최강 추론력·red-green·의사환경 게이트를 여기 집중. 적대 검증도 하드 추론이므로 fable5.
- **주력 모델(Opus 4.8, 이 세션 메인 루프)**: UI 프리미티브(shadcn 도입 §12.2)·화면 리디자인(§12.4)·공개 카피·스캐폴딩·테스트 보일러플레이트 등 저위험·기계적 부분. **추가로 fable5 크리티컬 산출물의 통합·2차 리뷰**(모델 다양성 확보) 담당.
> 실무 주의: fable5는 (1) 사고(thinking) 상시 on·단일 요청이 수 분 소요 → 타임아웃/스트리밍/진행 UX 대비, (2) 비용 2배 — 크리티컬 금전 로직에 한정 투입, (3) cyber/bio 세이프티 분류기 존재하나 본 결제·보안 코드는 방어 구현이라 refusal 리스크 낮음.

## 10. 열림/게이팅 (미정 — 구현 전 확정)
1. **PG/빌링 계약**(최상위): Toss 정기결제 상품, 빌링키 방식(위젯 issue vs 카드직수취), 실수수료율(3.5% 검증, 건당 −1,750원 미세적자 포함).
2. **작업비 결제 VAT**: 구독만 세금계산서인데 에스크로 결제(1,050,000)는 플랫폼 Toss 수취 → calcPayableAmount VAT 가산 처리·지급대행/에스크로 사업자 구조 세무자문.
3. 세금계산서 채널(팝빌 등) + P2-12·P3-22(통신판매업 신고, docs/15 보류) 연동.
4. SMS/이메일 벤더(분쟁·크레딧 만료·연체 고지 공용).
5. 추천 보상 액수, 최소작업비 3만원 하한 유지 여부, 시니어 '선택' 구독 부가혜택.
6. 유료 도구 결제수단 통일(service_order Toss 연동 vs 크레딧 전용 시작).
7. 공개 페이지 확정 문구(법적/영업, docs/15 방침).

---

## 11. 리팩토링 예상 문제점 & 완화 (fable5 코드 기반 사전 분석)
각 항목 = 실패모드 / 지점 / 가능성·영향 / 완화.

**11.1 이중 모델 공존·grandfather**
- **total_pay 의미변경이 6소비처에서 어긋남**(checkout:69·confirm-deposit:66·refund:59·quote-section:72/103·quote/statement docs). 한 곳이라도 pricing_model 분기 누락 시 "결제는 공급가만" 과거 사고(pricing.ts:45) 재발·환불상한 오류. **[치명]** → 숫자 인자 대신 **`{pricing_model,work_fee,total_pay,…}` deal 단위 파생함수 1개**로 재설계, 기존 숫자 시그니처는 **제거**(deprecated로 남기면 계속 쓰임)해 tsc가 전 소비처 강제 방문.
- **grandfather 문서 소급변형**(quote:197/statement:180 = 법적 증빙) → 템플릿 pricing_model 분기 + **스냅샷 테스트로 구모델 렌더 동결**.
- **deal 생성 2경로**(matching/actions·invitation/actions via cap-pricing) 부분 전환 창 → **공유 `createDealPricing()` 하나로 흡수 후 한 커밋 전환**. `budget_hope||100000` 기본값·3만원 하한 throw 계승 여부 **명시 결정**.
- **past_due 게이트는 UI 아닌 서버액션/API에서 집행**(acceptMatching·acceptInvitation·checkout는 adminClient=RLS 우회) → 소유권검증 직후 `assertSubscriptionAccess()` 삽입 지점을 파일:함수로 매트릭스에 명기.

**11.2 금전 불변식·반올림**
- **3중 독립 반올림**(청구×1.05·지급×0.955·크레딧×0.05 + calcVat) → `charged≠payout+credit+platform` ±1~2원. **[중]** → **차감 유도 원칙**(독립 반올림 1개만, 나머지는 뺄셈) + work_fee 3만~1억 스윕 **property 테스트**.
- **guarantee_fund 조용한 정지**(match_fee=0→guarantee_fee=0, `>0`만 기록해 무로그 고갈) **[높음]** → 본 설계는 재원을 거래 5%로 확정 → guarantee_fund는 'risk_reserve'(1%)·'credit_recovery'로 재정의(§2.3), legacy 'accrue'/'payout' 소비처는 grandfather로만.

**11.3 마이그레이션·타입·fresh-reset**
- **★0029 기본권한 함정**: `0029_public_schema_grants`가 이후 생성 테이블/함수에 anon·authenticated DML/EXECUTE 자동 부여 → 0030+에서 `credit_ledger`·`billing_key` 만들며 **RLS ENABLE 한 줄 누락 시 anon이 PostgREST로 크레딧 직접 insert**. 구스키마와 기본값이 **반대**. **[치명]** → 각 신규 금전 테이블 생성 직후 같은 파일에서 `ENABLE ROW LEVEL SECURITY`+명시정책(무정책=deny), 신규 RPC는 `REVOKE EXECUTE FROM anon,authenticated`. DoD에 "SET ROLE anon 신규 테이블 insert/select 거부" 추가.
- **enum 확장 fresh-reset 재발**(이미 0021 전력, docs/12) → 신규 상태는 **기존 enum 확장 대신 신규 테이블 자체 enum으로 격리**. 불가피하면 ADD VALUE 단독 파일 + **fresh 전체체인 + incremental(0030+) 양경로** 의사환경 검증.
- **타입 재생성 순서**(db:types는 프로드 project-id 생성, query-types 수동) → 배포 "push→db:types 재생성 커밋→코드" 3단, query-types 금전 인터페이스에 pricing_model 추가.

**11.4 Toss billingKey 정기결제**
- **★orderId 스킴 충돌**: `parseOrderId`(payment.ts:31)가 `parts[1]` 무검증 dealId 반환 → `jisane_sub_…`가 dealId='sub'로 파싱→confirmAndRecordDeposit 404→non-2xx→**Toss 무한재전송**. **[높음]** → build/parse를 **판별 유니온**(`jisane_deal_…`/`jisane_sub_…`, 레거시는 UUID형만 deal) + 웹훅 kind 라우팅 + round-trip/오염 vitest.
- **웹훅이 DONE 외 무시**(webhook:53) → 정기결제 실패/빌링키 이벤트 유실, past_due 웹훅 트리거 0 → 이벤트타입별 dispatch 표 + 미지이벤트 로그(정직).
- **★정기청구 멱등**(기지 결함 클래스): 재시도/중복 cron에 같은 (subscription,월) invoice 2건→**이중과금**. **[치명]** → `UNIQUE(subscription_id,period)` + orderId를 **invoice에서 결정적 유도(Date.now 금지 — 재시도마다 새 orderId면 멱등키 무력화)** + 상태전이 `.eq()` CAS.
- **dunning 경합**(자동재시도 vs 수동결제, 웹훅 순서역전) → invoice 행 CAS(pending→charging) 선점, subscription 상태는 invoice에서 파생.

**11.5 크레딧 원장 정합**
- **★이중 적립**: auto-settlement 비트랜잭션 파이프라인에 earn 얹으면 재실행 시 중복. **[치명]** → docs/14 `release_settlements_with_ledger` RPC를 **선행 의존(병렬 아님)** + `UNIQUE(settlement_id) WHERE earn` + earn RPC CAS, 23505=정상.
- **동시 spend/expiry**: 데드락·음수잔액·balance_after lost-update → spend·expire 모두 `ORDER BY earned_at,id FOR UPDATE`, 잔액 캐시 없이 SUM, 2세션 직렬화 테스트.
- **크레딧+카드 혼합결제 = P1-9 동형**(예약→PSP→확정/롤백) → P1-9 reserve 설계를 **크레딧에 일반화(reserve_credit RPC) 한 번만** 구현.

**11.6 정산↔크레딧↔분쟁↔환불**
- **★환불 vs 5%적립 레이스**(P1-9 확장): 30일 경과 earn과 전액환불 동시 → 환불+크레딧 **이중 유출**. **[치명]** → earn RPC WHERE에 `escrow_status='released' AND refunded_amt=0` CAS, 환불 라우트에 hold/credit **clawback을 같은 트랜잭션**, 음수지갑 허용 여부 정책 결정.
- **분쟁 enum 확장이 auto-release fail-closed 뚫음**(auto-settlement:51 `.eq('open')`만) **[치명]** → 지급차단 상태를 **공유 상수 화이트리스트 반전** + enum 전수 스위치 테스트(labels pinning 패턴).
- **홀드 단계 표현**: escrow_status에 홀드 없음 → escrow_status 확장 말고 **credit_ledger의 hold→earn/revoke 행 전이로 모델링**(settlement 불변).

**11.7 신규 금전 테이블 RLS/authz**
- **billing_key 유출 = payment_key(P3-92) 상위호환**(재청구 능력) → 클라 롤 SELECT 정책 봉쇄(service_role 전용), `select('*')` 금지 리뷰게이트.
- **credit RPC EXECUTE anon 자동부여**(0029) → RPC 내 `auth.uid()` 소유권검증 or service_role REVOKE, 의사환경 거부 확인.
- **환불·clawback이 정적 x-admin-secret 하나에 의존**(refund:20) → verifyAdmin 세션 병행 + 조정 audit 로그.

**11.8 테스트 게이트(필수)**: 구모델 값 동결 pin(pricing.test 유지) + 신모델 property 불변식 · orderId round-trip/충돌 · 크레딧 RPC 2세션 직렬화 · release+earn 원자성 · auto-release 분쟁 전수 차단 red-green · 마이그 fresh+incremental 양경로 · 신규 5테이블 RLS 거부/허용 매트릭스 · 웹훅 dispatch · **expert/lib actions 테스트 0건(docs/11:291) 최소 보강**.

**11.9 롤아웃·가역성**: pricing_model 기본값은 **영구 legacy**(신코드가 항상 명시 'subscription') · in-flight quoted 거래는 저장 total_pay로 결제 가능(화면·문서만 분기) · **크레딧=되돌릴 수 없는 부채**(킬스위치=신규 발행 중단, 원장 삭제 아님) · past_due 게이트 **fail-open**(조회 실패 시 허용+CRITICAL 로그; 금전 가드는 fail-closed) · 0030+는 순수 덧셈·IF NOT EXISTS 멱등.

**11.10 조직·프로세스**: **Toss 자동결제 가맹 계약이 하드 의존**(계약 전 §4·5·6 착수 불가 → 계약무관 선행분[스키마·pricing 이원화·orderId·RLS]과 종속분 워크스트림 분리) · 세무(세금계산서 주기·크레딧 과세표준·파트너 원천징수 3.3%)가 스키마 선행 · **통신판매업 신고(P3-22 보류)는 과금 개시 전 필수로 승격** · SMS 부재+이메일 부재자(P3-34/72)로 dunning 통지 도달 이슈 → 유예기간은 절대일수+약관 명시 · 공개 요율 카피는 확정 문구 수령 후(표시광고법).

---

## 12. UI/UX 구조 개선 + 디자인 시스템 고급화 (fable5, 코드 실측)
> 전제: docs/13 D배치로 달성한 **WCAG AA 대비값(#15803d/#b45309/#6b665b) 동결**. 신규 구독 서피스는 이 시스템 위에 처음부터 구축.

**12.1 디자인 언어 — "조용한 신뢰(Quiet Trust)"**: 한지+먹+인장 메타포. 고급스러움=절제 → **그라디언트·글로우 퇴역**(`cta-pulse`·`brand-glow`·`card-glow`·`text-brand-gradient` globals.css:148-154,199 = generic-AI 인상의 주범). 대체=타이포 위계·헤어라인 보더·여백·정밀 숫자조판.
- **타이포**: Pretendard+Gowun Batang 유지하되 **CDN link→next/font 셀프호스팅**, **타입 스케일 토큰 신설**(display/h1~h3/body/caption, 한글 letter-spacing·line-height≥1.6), **`.tnum`(tabular-nums)**를 돈 나오는 전 화면 필수.
- **컬러**: `--primary` 딥그린을 **50~950 램프**로 확장(현 2단으론 호버/프레스/틴트 표현 불가→임의 알파 난립), 앰버 `--accent`는 유일 포인트 사수, `bg-white` 하드코딩 40여곳 **토큰화**(다크모드 전제), **다크모드 신설**(현재 없음, `.dark`+시맨틱 토큰 경유 강제 후 AA 재계산).
- **형태·모션**: radius 스케일 고정(shadcn 계약과 동형), 그림자 5단 유지, 모션 토큰(fast150/base200/slow300, ease-out) + transform/opacity만·전체 fade-in 남용 중단, **부엉이 마이크로모션은 브랜드 자산으로 보존**(로딩·빈상태·delight).

**12.2 shadcn/ui 점진 도입(빅뱅 없음)**: `packages/ui/components/primitives/*` + `lib/cn.ts`, `components.json` 1개. 의존성 추가(radix·CVA·clsx·tailwind-merge·lucide·sonner). **Tailwind v4 CSS-first 공식 지원**(현 globals.css `@theme`과 동일 패턴) → **토큰 브리지**(shadcn `--card/--muted/--ring/--destructive/--radius`+`*-foreground`를 기존 값에서 파생). **충돌 주의**: shadcn `--accent`(은은한 호버)≠지사네 `--accent`(앰버 브랜드) → 생성 코드에서 accent 참조를 `--surface`로 치환(값 변경 금지, 소비처 다수).
- **도입 순서**: W1 Button/Card/Badge/Skeleton/Input, W2 Dialog/AlertDialog/DropdownMenu/Sheet/Tooltip, W3 Tabs/Select/Sidebar/Sonner.
- **기존 a11y 위젯 Radix 매핑(자산 보존)**: focus-trap→Radix 내장(소비처 0 후 삭제), roving-focus→Radix Tabs `activationMode="manual"`(dashboard-tabs 수동활성 의도 보존), **filter-radio-group은 유지**(Radix RadioGroup은 화살표=즉시선택뿐 — 서버왕복 필터의 selectOnArrow=false 의도와 상충 → 정식 멤버로 승격), toast-policy 지속시간→Sonner duration 주입.
- **트레이드오프**: 표현 컴포넌트(Card/Badge/Skeleton)는 CVA만으로 **서버 안전**, 인터랙션만 'use client'. 랜딩/공개는 오버레이 임포트 금지. **최대 리스크=shadcn 기본 팔레트(zinc) 복붙으로 AA 회귀** → 생성 직후 토큰 치환 체크리스트.

**12.3 IA/UX 구조 개편**: **최대 문제=`responsive-container`(≤48rem)가 데스크탑을 죽임** → **서피스별 컨테이너 4종**(marketing72/app64/form42/read40). 모바일 하단탭 유지·**≥md에서 숨기고 헤더 인라인 내비**. `PageHero` 다크밴드는 마케팅 전용 강등, 내부 페이지는 밝은 슬림 타이틀.
- **owner**: 하단탭 재편(홈/의뢰·거래/도구·서비스/지갑/마이), status 상세=데스크탑 **스플릿뷰**(좌 타임라인, 우 sticky 메시지), request 폼=스텝퍼.
- **expert**: work=스플릿뷰(좌 워크플로 체크리스트, 우 메시지), matching=카드 큐, profile-editor=좌편집/우미리보기.
- **admin**: **dashboard 9탭(클라 상태·딥링크 불가)→라우트 세그먼트+shadcn Sidebar** 4그룹(+신규 구독·빌링 운영).
- **partner**: admin과 **Sidebar 쉘 공용화**(개요/서비스/주문/커미션/정보).
- empty 상태=OwlIcon 일러스트+단일 CTA 규격(error-state와 쌍인 empty-state 프리미티브), 목록 페이지네이션=cursor "더 보기".

**12.4 핵심 화면 리디자인**: 랜딩(다크밴드+serif+부엉이+구독 가치제안, cta-pulse 제거, 요금은 docs/15 게이트) · **구독/요금제**(멤버십 카드 메타포, 다음 결제일·빌링키 마스킹, past_due=회색+경고) · **크레딧 지갑**(tnum 대형 잔액+만료임박 앰버경고, 원장 리스트, `CREDIT_LEDGER_BADGE_CLASSES` 신설) · **도구 카탈로그**(free/subscription/paid 3티어 배지, 비구독 잠금 오버레이+업셀) · **파트너 커미션**(매출·20%·실수령 3스탯 tnum+월추이+명세) · **admin 대시보드**(Sidebar+4열 스탯 그리드+shadcn Table) · **past_due 전역 규격**(헤더 경고 스트립·자물쇠·재시도 CTA, `SUBSCRIPTION_STATUS_BADGE_CLASSES` 신설).

**12.5 단계 롤아웃(구독 피벗과 정렬)**: P0 파운데이션(토큰 확장·next/font·cn+CVA+W1·컨테이너 4종, 기존 화면 무변경) → P1 신규 구독 서피스 **그린필드 구축**(마이그레이션 리스크 0) → P2 owner → P3 expert → P4 admin+partner 쉘(탭→라우트) → P5 정리(위젯 소비처 0 확인 후 삭제·그라디언트 퇴역·다크모드 출시). 리스크: Tailwind v4는 `tw-animate-css`, `--accent` 의미충돌은 생성코드 치환, 토큰 리네임 금지(추가만·AA 동결), 다크모드는 신규작업(`bg-white` 토큰화 선행).

**12.6 UI 관련 단일소스 확장**: `packages/shared/lib/status-badges.ts`에 구독/크레딧/커미션 상태 배지 추가 · `globals.css`가 토큰·브리지·모션 규정 단일지점 · `packages/ui/package.json` 프리미티브 export.

---

## 관련 문서
docs/15(피벗 브리프)·docs/14(P1-9/17, 동일 게이트·선행 의존)·docs/11(감사, 매칭비 대체)·docs/13(작업계획).
