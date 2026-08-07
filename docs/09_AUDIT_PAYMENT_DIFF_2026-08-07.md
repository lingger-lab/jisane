# Audit 2026-08-07 — scope=full set=diff model=fable
> 대상: 토스페이먼츠 결제 방아쇠 배선 변경분 (5파일 764라인)
> coverage: 5/5 files · confirmed P1 2 · P2 9 · P3 9 · refuted 0
> quote-back: 20 OK / 0 MISMATCH (허위 판독 없음)
> 게이트: tsc 3앱 exit 0 · build 3/3 성공 exit 0 · lint 실패는 전부 기존 결함(증명 첨부)
> axes NOT run: 시각 스윕(visual sweep) — 앱 구동 기반 렌더 검증 미실시

## 처리 현황 (2026-08-07 갱신)

| 등급 | 확정 | 처리 | 미처리 |
|---|---|---|---|
| P1 | 2 | **2 ☑** | 0 |
| P2 | 9 | **8 ☑** | 1 (P2-8 테스트 — 아래 사유) |
| P3 | 9 | **6 ☑** | 3 |

처리 커밋: `4c3438e`(VAT 단일 소스) · `2d40664`(결제 신뢰성·orderId 계약) ·
`bb3d3ef`(토스트 전역) · `7da3a6e`(결제 UI 배선·상태화면·a11y)

**의도적 미처리:**
- **P2-8 머니패스 테스트 0건** ⏸ — 저장소에 테스트 러너 자체가 없어 vitest 도입이 선행돼야 하고,
  이는 의존성 추가 결정 사안이라 보류(사용자 지시). **결제 로직이 자동 검증 없이 동작 중**임을 명시해 둔다.
  최소 착수 지점: `buildOrderId`↔`parseOrderId` 왕복 핀 테스트, `confirmAndRecordDeposit` 2회 호출 멱등 테스트.
- **P3 잔여 3건** ☐ — 순차 DB 왕복 3회(성능), Supabase 에러 무시, "금액 상의" 문의가 owner에게
  다시 보이지 않음(UX 설계 판단 필요).
- 방출부 ~20곳을 `SuccessCode`/`ErrorCode` 타입으로 강제하는 작업 ☐ — 현재는 union export까지만.

## 0. 게이트 증거 (실행 결과)

의존성 설치 후 실제 실행한 결과다. "통과할 것"이 아니라 명령 출력·exit code 기준.

| 게이트 | 결과 |
|---|---|
| `npm ci` | ✅ exit 0 |
| `tsc --noEmit` (admin·owner·expert) | ✅ **3앱 전부 exit 0, 에러 0** |
| `turbo run build --force` | ✅ **3 successful / 3 total, exit 0** (35.4s) |
| 결제 라우트 산출물 | ✅ `.next/server/app/api/payments/{checkout,fail,success,webhook}/route.js` 생성 확인 |
| `PaymentButton` 번들 포함 | ✅ SSR 청크 + static 청크에서 문자열 확인 |
| `turbo run lint` | ❌ exit 1 — **전부 기존 결함**(아래 증명) |

**린트 실패 귀속 증명** (verification.md: "증거 없이 pre-existing 딱지 금지"):
- `apps/admin/lib/partner/actions.ts:155` (`prefer-const`) — `git status`에 없음 = 미변경 파일 → HEAD 시점부터 존재
- `packages/ui/components/toast.tsx:27,77` (`react-hooks/set-state-in-effect`) — 내 diff 청크는 `@@ -10,0 +11 @@`, `@@ -59,0 +61,2 @@` (메시지 맵 3줄)뿐. effect 본문 미변경 → 기존 결함
- 즉 **이번 변경이 새로 만든 lint 에러는 0건**. 단 기존 실패가 있으므로 CI lint 게이트는 여전히 red.

## 0-1. 귀속: 이번 변경이 만든 것 vs 원래 있던 것

**이번 변경이 도입/전파한 것 (3건, 전부 P3 이하 + P1 전파 1건):**
- `payment-button.tsx:40` — 네이티브 `confirm()`을 최고위험 액션의 확인 게이트로 사용 (P3)
- `payment.ts:22` — `isPaymentEnabled`에 server-only 가드 없음, 클라이언트 임포트 시 조용히 false (P3)
- **P1-2 VAT 문구를 결제 확인창에 전파** — 기존 `quote-section.tsx:64`의 "VAT 별도"를 `payment-button.tsx:41`에 그대로 복사. 원인은 기존 불일치지만, **실제 청구가 일어나는 지점에 옮겨온 것은 이번 변경**이다.

**원래 있던 것 (17건)** — toast 타이머·VAT 산식 불일치·`deals[0]` 순서·RSC 페이로드 노출·payment.ts 계약 혼재·테스트 0 등.

**이번 변경이 고친 것:** 토스트 메시지 맵 누락 3키(`success=payment`, `error=payment`, `error=payment_invalid`) — 결제 후 안내 미표시 / raw 코드 노출 해소. 단 P2-3은 **다른 코드들의 드리프트가 여전히 남아있다**고 지적한다.

## P1
### P1-1. Toast auto-dismiss timer is always cancelled by its own router.replace — toast never disappears
- `packages/ui/components/toast.tsx:36` · correctness · quote-back: OK · ☑ fixed (bb3d3ef)
- The effect (a) sets the message, (b) calls router.replace to strip the query param, (c) schedules the 3s dismiss timer and returns a cleanup that clears it. The router.replace in step (b) changes the URL, so useSearchParams returns a new ReadonlyURLSearchParams; the [searchParams, router] dep array changes, React runs the cleanup (clearTimeout — killing the dismiss timer) and re-runs the effect, which now finds no key and schedules nothing. `message` is never reset, and there is no dismiss button anywhere in the component. The fixed, z-50, non-pointer-events-none banner therefore sticks at the top of the viewport for the rest of the client session and intercepts clicks in that band. Identical bug in ErrorToast (line 83, 4000ms). This component is mounted on ~9 pages across all three apps, so it hits every success/error redirect in the product.

### P1-2. "VAT 별도" on the paid amount contradicts the quote/statement documents, which bill total_pay + 10% VAT
- `apps/owner/app/(main)/status/[id]/quote-section.tsx:64` · correctness · quote-back: OK · ☑ fixed (4c3438e)
- The owner is shown total_pay labelled '총 비용 … VAT 별도' and the payment confirm dialog (payment-button.tsx:41) repeats '견적 N원(VAT 별도)을 결제하시겠습니까?', but /api/payments/checkout charges exactly deal.total_pay (checkout/route.ts:62) and confirm-deposit.ts:46 approves that same amount into escrow. Meanwhile the linked documents this very page offers ('견적서 보기' / '거래명세서 보기', page.tsx:262/269) compute `const vat = Math.round(deal.total_pay * 0.1)` and print 합계 = total_pay + vat (apps/admin/app/docs/quote/[dealId]/page.tsx:98,212 and .../statement/[dealId]/page.tsx:97,199). Two surfaces in the same flow answer 'how much does the owner owe' with numbers differing by 10%, and the customer is told VAT is excluded while nothing ever collects it. Money must have one owner: derive the charged amount and the document total from one function.

## P2
### P2-1. deal chosen as deals[0] with no ORDER BY and no unique constraint on deal.request_id
- `apps/owner/app/(main)/status/[id]/page.tsx:65` · correctness · quote-back: OK · ☑ fixed (7da3a6e)
- The query at line 60-63 selects all deals for the request with no .order() and no .limit(); Postgres gives no row-order guarantee without ORDER BY, so which deal is picked can change between page loads. supabase/migrations/0001_init.sql:86 declares `request_id uuid references request(id)` with NO unique constraint (only matching_id is unique), and a request can have several matchings, so multiple deal rows per request are reachable. Every downstream decision on this page — which quote/amount the owner is asked to pay (QuoteSection→PaymentButton→/api/payments/checkout uses deal.id), which workflow, which message thread, which review, which settlement/dispute — hinges on this arbitrary pick. Fix: order by created_at desc (or filter out terminal deals) and make the intent explicit.

### P2-2. Expert identity and internal fee split shipped to the browser despite the documented anonymity/직거래-방지 design
- `apps/owner/app/(main)/status/[id]/page.tsx:182` · security · quote-back: OK · ☑ fixed (7da3a6e)
- QuoteSection is a client component, so both props are serialized into the RSC flight payload and are readable in page source. `expert` is selected at line 101 as `id, auth_user_id, name, field, career_years, grade` — the card deliberately renders only '경력 N년 시니어지식인' + field, but the expert's real name and their auth_user_id (an internal auth UUID) travel to the owner's browser anyway. `deal` is the full DealRow, so work_fee and match_fee reach the client too, directly contradicting the comment at quote-section.tsx:57 ('총 금액 — total_pay만 표시 (직거래 방지)'): the owner can read exactly what the expert is paid and what the platform takes, which is the disintermediation the design is trying to prevent. Pass only the fields the UI renders (career_years, field, deal.id, total_pay, due_date).

### P2-3. ErrorToast renders arbitrary attacker-controlled query text as a site-styled alert
- `packages/ui/components/toast.tsx:77` · security · quote-back: OK · ☑ fixed (bb3d3ef)
- `ERROR_MESSAGES[key] || key` falls through to the raw ?error= value, so any URL (?error=계정이 정지되었습니다. 1588-XXXX로 전화해 본인확인을 진행하세요) renders that sentence inside the product's own red alert chrome, role=alert, on an authenticated page — a ready-made phishing/social-engineering surface that needs no XSS. SuccessToast (line 27) correctly gates on `SUCCESS_MESSAGES[key]` existing; ErrorToast does not, so the two halves of the same file disagree on whether the query param is trusted. Secondary effect: unmapped internal codes leak raw English identifiers ('exchange_failed') into a Korean UI. Whitelist like SuccessToast does and fall back to a generic message.

### P2-4. Message maps have drifted from the codes actually emitted — success feedback silently vanishes and auth failures show nothing
- `packages/ui/components/toast.tsx:6` · structure/state · quote-back: OK · ☑ fixed (bb3d3ef)
- The maps are one file, the emitters are ~20 redirect sites, and nothing pins them together (there are no tests in the repo at all). Verified drift: `?success=created` and `?success=saved` are emitted (apps/admin/lib/partner/actions.ts:98,174,234) but are absent from SUCCESS_MESSAGES, so the redirect silently shows nothing after a save; `expert_registered` is in the map but no code emits it (dead entry). Worse for errors: `no_code`, `exchange_failed`, `no_user`, `profile_create`, `auth` are emitted by every app's auth callback to `/` (apps/owner/app/(auth)/callback/route.ts:11,19,24,44 and siblings), none are in ERROR_MESSAGES, and `/` does not mount ErrorToast at all (only the pages grepped at status/mypage/dashboard do) — a failed login bounces the user to the home page with zero explanation, a complete dead end in the onboarding flow. Mount the toasts once in the root layout and export the code union so emitters can't invent unknown keys.

### P2-5. Malformed Toss checkout response silently degrades to an empty checkout URL
- `packages/shared/lib/payment.ts:69` · honesty · quote-back: OK · ☑ fixed (2d40664)
- If Toss returns 200 with a body lacking `checkout.url` (API change, alternate method, partial response), `|| ''` swallows it and createCheckoutSession reports success. /api/payments/checkout then persists result.paymentKey into settlement (checkout/route.ts:67-70) and returns HTTP 200 with `checkout_url: ''`; the client's `!data.checkout_url` guard (payment-button.tsx:57) shows the generic '결제 요청에 실패했습니다. 잠시 후 다시 시도해주세요.' So a real integration failure is presented as a transient retryable one, a live Toss payment session exists that nobody can reach, and nothing is logged. Throw on a missing checkout URL instead of substituting a falsy placeholder.

### P2-6. orderId is time-derived, so checkout creation is non-idempotent and its format is re-parsed by hand elsewhere
- `packages/shared/lib/payment.ts:42` · concurrency & data integrity · quote-back: OK · ☑ fixed (2d40664)
- Every call mints a new orderId for the same deal, and the create call carries no Idempotency-Key (unlike cancelPayment, which does at line 124). A double-click, a browser retry, or two tabs therefore leave multiple live Toss payment sessions for one deal, and settlement.payment_key — a single column — is overwritten by whichever checkout ran last (checkout/route.ts:67), so the stored key can point at a session the customer never paid, corrupting refund/reconciliation lookups until confirm-deposit rewrites it. Capture is saved only by the escrow_status guard in confirm-deposit.ts:41. Second issue from the same line: the `jisane_{dealId}_{ts}` shape is a cross-file contract re-derived by string splitting in apps/owner/app/api/payments/webhook/route.ts:57-61 with no shared builder/parser and no test pinning the two — change the separator here and the webhook silently starts rejecting every callback.

### P2-7. confirmPayment mixes two error contracts: returns a result for HTTP errors, throws for timeout/network
- `packages/shared/lib/payment.ts:81` · resilience · quote-back: OK · ☑ fixed (2d40664)
- A 4xx/5xx from Toss comes back as `{success:false,...}`, but the AbortSignal.timeout(15s) at line 88 and any socket error reject the fetch, so the function throws instead. confirmAndRecordDeposit only inspects `confirmResult.success` (apps/owner/lib/payments/confirm-deposit.ts:47) and has no try/catch, so a slow Toss turns into an unhandled rejection propagating out of the route rather than the documented `ok:false` path — the webhook still 500s (Toss retries), but the success redirect surfaces an unhandled error instead of the payment error copy. Also, unlike cancelPayment, confirm accepts no Idempotency-Key even though it is the retried-after-timeout call and is invoked from two independent paths (webhook + redirect). Pick one contract (never throw, or always throw) and add the idempotency key.

### P2-8. Zero automated tests exist for the money path (or anywhere in the repo)
- `packages/shared/lib/payment.ts:34` · test-gaps · quote-back: OK · ☐ untaken
- `find . -name "*.test.ts*" -not -path "*/node_modules/*"` returns nothing across the monorepo. The escrow flow — amount authority (server-side total_pay), orderId↔webhook parsing contract, the idempotency guard in confirm-deposit.ts, the ALREADY_PROCESSED_PAYMENT branch, VAT handling — is entirely unverified, and the map/format couplings flagged above have nothing that can go red when they drift. At minimum: a unit test pinning the orderId build/parse round-trip against the webhook's split logic, and one covering confirmAndRecordDeposit called twice (must be idempotent).

### P2-9. Alpha-modified success text on success-light background falls below AA contrast
- `apps/owner/app/(main)/status/[id]/quote-section.tsx:131` · a11y · quote-back: OK · ☑ fixed (7da3a6e)
- `text-success/70` on `bg-success-light` (and the same pattern at page.tsx:238, `text-success/80` on the same background) drops an already low-contrast token to roughly half its luminance separation, well under the 4.5:1 required for body text. Use a darker success token (or the muted text token) rather than reducing the accent's alpha over a tinted surface.

## P3
| # | file:line | dimension | title |
|---|---|---|---|
| 1 | `apps/owner/app/(main)/status/[id]/page.tsx:60` | honesty | Every Supabase error is discarded, so a transient DB failure renders as an earlier lifecycle state |
| 2 | `apps/owner/app/(main)/status/[id]/page.tsx:157` | ui-ux | No content block for request_status 'dealt' or 'closed' without a deal — page dead-ends with only a progress bar |
| 3 | `apps/owner/app/(main)/status/[id]/quote-section.tsx:25` | ui-ux | "금액 상의" message is written to the inquiry table and never surfaces anywhere the owner can see |
| 4 | `apps/owner/app/(main)/status/[id]/quote-section.tsx:106` | a11y | Inquiry textarea has no accessible label, and empty submit fails silently |
| 5 | `packages/ui/components/toast.tsx:47` | a11y | Toast has no dismiss control and captures pointer events over the content beneath it |
| 6 | `apps/owner/app/(main)/status/[id]/payment-button.tsx:40` | ui-ux | Native confirm() used as the confirmation gate for the highest-stakes action in the product |
| 7 | `packages/shared/lib/payment.ts:22` | honesty | isPaymentEnabled has no server-only guard and fails closed silently if imported client-side |
| 8 | `apps/owner/app/(main)/status/[id]/page.tsx:46` | performance | Three sequential DB round-trips before the parallel batch on every page load |
| 9 | `apps/owner/app/(main)/status/[id]/quote-section.tsx:42` | ui-ux | Avatar shows a hardcoded latin "P" (leftover from the partner→시니어지식인 rename) |

## 권장 조치 순서

1. **P1-2 VAT 불일치 — 결제 활성화 전 필수.** 견적서/명세서는 `total_pay + 10%`를 청구액으로 인쇄하는데 결제는 `total_pay`만 긁는다. 고객이 보는 두 숫자가 10% 다르고, "VAT 별도"라 안내하면서 부가세를 아무도 걷지 않는다. **청구 금액과 문서 합계를 한 함수에서 파생**시켜야 한다(돈은 단일 소유자 원칙). 지금은 `isPaymentEnabled`가 false라 실결제가 막혀 있어 시간 여유가 있으나, **키를 넣는 순간 잘못된 금액이 청구된다.**
2. **P1-1 토스트 영구 잔류** — 3앱 ~9곳에 마운트된 공용 컴포넌트. 배너가 사라지지 않고 그 띠 영역의 클릭을 가로챈다. 결제 성공/실패 안내가 바로 이 컴포넌트를 탄다.
3. **P2 보안 2건** — RSC 페이로드로 전문가 실명·`auth_user_id`·`work_fee`/`match_fee`가 브라우저에 전달(직거래 방지 설계와 모순). `ErrorToast`가 쿼리 문자열을 사이트 스타일 알림으로 렌더(문구 주입).
4. **P2 나머지** — `deals[0]` 정렬 부재, Toss 응답 무결성(빈 checkout URL 조용한 통과), `orderId` 시간기반 비멱등, `confirmPayment` 에러 계약 혼재(HTTP는 반환·타임아웃은 throw), **머니패스 테스트 0**.
5. **P3 9건** — 위 표 참조. 네이티브 `confirm()` 교체, `isPaymentEnabled` server-only 가드, 아바타 "P" 잔재 등.

## 별건 (이번 변경과 무관)

- **npm 의존성 취약점 6건** (HIGH 5 · moderate 1): `next`(직접, HIGH — Server Actions SSRF·미들웨어 우회·내부 Server Function 미인증 노출 등 9개 권고), `@tailwindcss/postcss`(moderate, 직접), `sharp`·`postcss`·`js-yaml`·`brace-expansion`(전이). `npm audit fix` 가능하다고 표시되나 Next 업그레이드가 얽히면 별도 계획 필요.
- **CI lint 게이트 red** — 기존 `prefer-const` 에러 1건 때문. 이 저장소 CI에는 lint 스텝이 **존재**한다(감사문서 07의 M-9 "lint 없음"은 최신 상태와 다름 — 정정 필요).
- `apps/owner/lib/deal/actions.ts`의 `approveDeal`이 이번 배선으로 **고아**가 됨(호출부 0). 삭제 여부 미결.

---

*방법: `/audit` 스킬 — 결정적 매니페스트(diff 5파일) → 강모델 리더 팬아웃(전 축) → 적대적 검증(refuted 0) → 커버리지 크리틱(미독 0) → 기계적 quote-back(20/20 OK). 게이트는 실제 실행 결과이며, 시각 스윕과 토스 test 키 실결제는 미실시.*
