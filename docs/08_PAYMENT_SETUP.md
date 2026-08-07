# 토스페이먼츠 결제 — 셋업 런북 & 구현계획안

**작성일:** 2026-08-07
**목적:** ① 외적 과정(가맹 등록·키 발급)만 끝나면 바로 켤 수 있는 **셋업 런북**, ② 정석(결제위젯) **구현계획안**.
**성격:** 계획·문서. 이 문서 작성 시점에 결제 로직 코드는 변경하지 않았다.
**검증:** 정적 판독(2026-08-07) + 토스 공식문서 확인. 빌드·런타임 미실행(의존성 미설치).

---

## 1. 현재 상태 (직접 확인)

**백엔드 — 상당히 성숙:**
- `packages/shared/lib/payment.ts` — `createCheckoutSession`(서버 `POST /v1/payments`→`checkout.url`), `confirmPayment`(`/v1/payments/confirm`), `cancelPayment`(멱등키 지원). 3개 fetch 모두 `AbortSignal.timeout(15s)`. `NEXT_PUBLIC_SITE_URL`·`TOSS_SECRET_KEY` 미설정 시 throw.
- 라우트 4종: `apps/owner/app/api/payments/{checkout,webhook,success,fail}/route.ts`.
  - `checkout` — 인증 + 기업 소유권 검증(`owner.auth_user_id===user.id`), 금액은 `deal.total_pay` 서버산출. **금액 위변조 불가.**
  - `webhook` · `success` — 둘 다 공통 헬퍼 `apps/owner/lib/payments/confirm-deposit.ts`의 `confirmAndRecordDeposit`를 호출. 웹훅은 HMAC-SHA256 서명검증 후 진입.
- **`confirmAndRecordDeposit` — 결제 무결성의 핵심(정독 확인):**
  - 멱등 가드: `settlement.escrow_status !== 'pending'`이면 성공 단락(웹훅 중복·리다이렉트 경합 대응)
  - **compare-and-set**: `.update({escrow_status:'deposited'}).eq('escrow_status','pending')` — 원자적 전이
  - 금액은 **`deal.total_pay` 서버산출만** 사용(쿼리 `amount`를 신뢰하지 않음) → 위변조 불가
  - 토스 `ALREADY_PROCESSED_PAYMENT` 응답은 캡처 완료로 간주하고 DB 기록 계속
  - **캡처 이후 DB 실패는 `ok:false` 반환** → 호출자가 non-2xx로 응답해 웹훅 재전송 유도(자금-기록 괴리 방지)
- 필요 env(현행): `TOSS_SECRET_KEY`, `TOSS_WEBHOOK_SECRET`, `NEXT_PUBLIC_SITE_URL`. 전수는 `.env.example` 참고.

**갭 — 활성화를 막는 것 (2개뿐):**
1. **프론트 결제 방아쇠 부재 (핵심·유일한 실질 갭).** 전 앱 어디도 `/api/payments/checkout`를 호출하거나 `checkout_url`로 리다이렉트하지 않는다(2026-08-07 grep: 호출부 0). 견적승인 버튼은 `approveDeal`(상태만 `quoted→working`)만 호출 → **카드가 실제 청구되지 않는다.** 키를 넣어도 화면에 "결제하기"가 없어 흐름이 시작되지 않는다.
2. **미설정 시 graceful 상태 부재.** 키 없으면 결제 관련 호출이 500 throw. "결제 준비중" 안내 없음.

> 요약: **백엔드는 키를 넣으면 동작할 상태**지만, **프론트 방아쇠가 없어 end-to-end로는 아직 안 돈다.**

**감사(`07_CODEBASE_AUDIT`) 결제 지적사항 해소 현황 — 2026-08-07 재확인:**
| 감사 항목 | 상태 |
|---|---|
| H-2 웹훅 멱등성·캡처후 DB에러 미확인 | ✅ 해소 (`confirmAndRecordDeposit` 멱등가드+compare-and-set+non-2xx 반환) |
| H-4 `deals/[id]/approve\|confirm` fail-open 중복 라우트 | ✅ 해소 (라우트 삭제됨) |
| M-8 `success`/`fail` 라우트 부재 | ✅ 해소 (두 라우트 생성) |
| M-18 Toss fetch 타임아웃 없음 | ✅ 해소 (`AbortSignal.timeout(15s)` 3곳) |
| M-6 `NEXT_PUBLIC_SITE_URL` 미검증 | ✅ 해소 (미설정 시 throw) |
| H-3 환불 정적 시크릿·멱등키 | ⚠️ 부분 — `cancelPayment`에 `Idempotency-Key` 추가됨. `x-admin-secret` 인증·레이트리밋은 미해소 |

---

## 2. 외적 과정 런북 (이 순서대로 하면 켜짐)

1. **전자결제 신청** — 토스페이먼츠 가입 → 사업자 심사 → 계약. (live 키는 이 승인 이후에만 발급. **test 키는 즉시** 사용 가능.)
2. **키 발급** — 대시보드에서:
   - `TOSS_SECRET_KEY` (`test_sk_...` → 나중에 `live_sk_...`)
   - (정석 위젯 채택 시) `NEXT_PUBLIC_TOSS_CLIENT_KEY` (`test_ck_...`) — secretKey와 **한 세트**여야 함.
3. **웹훅 등록** — 대시보드 웹훅 설정에 수신 URL 등록: `{NEXT_PUBLIC_SITE_URL}/api/payments/webhook` → 발급된 서명 시크릿을 `TOSS_WEBHOOK_SECRET`에 설정.
4. **env 주입** — 각 앱 `.env.local`(또는 배포 환경변수)에 위 값 + `NEXT_PUBLIC_SITE_URL` 채우기. (`.env.example` 복사)
5. **test 검증** — test 키로 결제→승인→웹훅→에스크로 예치까지 end-to-end 확인.
6. **live 전환** — `test_*` 키를 `live_*`로 **값만 교체**(코드 변경 없음). test/live 혼용 금지(INVALID_API_KEY).

---

## 3. 정석 구현계획안 (결제위젯 SDK)

토스 공식 권장 = **결제위젯**(카드·간편결제·가상계좌 일괄 연동, 결제창보다 공수↓). 키는 `clientKey`+`secretKey` 세트.

**표준 흐름:**
```
클라이언트 위젯 렌더(clientKey) → requestPayment()
  → 토스 인증창 → successUrl 리다이렉트(paymentKey·orderId·amount 쿼리)
  → 서버: 쿼리 amount == 저장된 deal.total_pay 검증 → /v1/payments/confirm(secretKey)
  → 성공 시 에스크로 예치 + deal 상태 전이 (+ 웹훅으로 이중 확인)
```

**구현 단계 (착수 시):**
1. **의존성** — `@tosspayments/tosspayments-sdk` 추가(`packages/ui` 또는 owner 앱). NEXT_PUBLIC_TOSS_CLIENT_KEY 도입.
2. **결제 트리거 컴포넌트** — owner 견적 화면에 위젯 마운트 + "결제하기" 버튼. `requestPayment` 호출.
3. **결제 시점 배선** — §5 결정에 따라 견적승인 흐름과 결합(정석=승인이 곧 결제, 결제 성공 시에만 `working` 전이 — 이 전이는 `confirmAndRecordDeposit`가 이미 수행).
4. **graceful 게이트** — `isPaymentEnabled()`(서버측 `TOSS_SECRET_KEY` 존재) → UI가 미설정 시 "결제 준비중" 표시. 결제 컴포넌트와 **함께** 배선(버튼이 이 값을 소비하므로 dead code 아님).

> success 라우트·웹훅·멱등성은 **추가 작업 불필요**(§1 확인 완료). 서버 종단은 이미 완성돼 있다.

**대안 — 현행 서버 리다이렉트 유지:** `clientKey`·SDK 불필요(시크릿 2종만). `checkout_url`로 리다이렉트하는 버튼만 배선하면 됨. 위젯보다 결제수단 확장성·UX는 약하나 활성화까지 변경범위가 가장 작음.

| | 현행(서버 리다이렉트) | 정석(결제위젯) |
|---|---|---|
| 추가 키 | 없음(시크릿 2종) | `NEXT_PUBLIC_TOSS_CLIENT_KEY` |
| SDK 의존성 | 불필요 | 필요 |
| 결제수단 | 카드 중심 | 카드·간편결제·가상계좌 일괄 |
| 활성화 변경범위 | 작음(버튼+리다이렉트) | 중간(SDK+위젯 컴포넌트) |

---

## 4. 활성화 체크리스트 (키 꽂은 뒤)

- [ ] `.env.example`의 토스·사이트 변수 채움
- [ ] 토스 대시보드에 웹훅 URL 등록 + `TOSS_WEBHOOK_SECRET` 설정
- [ ] 프론트 결제 방아쇠 배선 완료(§3 — **현재 미구현, 유일한 실질 갭**)
- [ ] test 키로 결제→승인→웹훅→예치 end-to-end 통과
- [ ] `npm install && turbo run build` 통과 (현 세션 미실행)
- [ ] live 키 교체 + 실결제 1건 소액 검증

---

## 5. 미결정 사항 (착수 전 확정 필요)

- **⚠️ 부가세 청구 정책 — 사업 확인 필요 (2026-08-07 반영, 다음 작업 고려사항).**
  현재 코드는 **`deal.total_pay` = 공급가(VAT 제외)**, **실제 청구액 = 공급가 + 10%** 로 통일했다.
  근거: `pricing.ts` 헤더 "VAT 별도 기준", 견적서·거래명세서가 `총 결제 예정액 = total_pay + vat`로 인쇄,
  전 화면 카피가 "VAT 별도". 이전에는 **결제만 공급가를 청구**해 문서와 10% 어긋나 있었고, 부가세를
  걷는 코드가 어디에도 없었다(감사 09 P1-2).
  → **이 변경은 고객 청구액을 10% 인상한다.** 부가세 별도 청구가 사업 의도가 맞는지 확인할 것.
  아니라면 방향은 반대(문서에서 VAT 행 제거 + `calcPayableAmount`가 공급가를 그대로 반환)이며,
  단일 소스 구조(`packages/shared/lib/pricing.ts`의 `calcVat`/`calcPayableAmount`)는 그대로 재사용 가능하다.
  실결제 검증(토스 test 키) 시 **생성액·승인액·문서 합계 3개가 같은 값인지** 반드시 확인.

- **결제 시점** — (권장) 견적승인=예치: 승인 버튼이 결제창을 띄우고 **결제 성공 시에만** `working` 전이. vs 승인과 분리된 별도 "결제하기" 단계. → 에스크로 흐름(견적→예치→작업→검수→정산)과 함께 검토 후 확정.
- **연동 방식** — 정석(위젯) vs 현행(서버 리다이렉트). §3 표 참고.

---

*이 문서는 셋업 런북 + 구현계획이다. 서버 파이프라인(체크아웃·승인·멱등 예치·웹훅)은 **이미 완성**돼 있고, 미착수는 **프론트 결제 방아쇠 + graceful 게이트** 뿐이다. 착수는 §5 확정 + `/plan` 승인 후(결제 로직 하드게이트).*
