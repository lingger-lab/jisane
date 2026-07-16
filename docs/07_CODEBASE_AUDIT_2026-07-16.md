# 코드베이스 전수검사 — 검수 진행 내역

**검수일:** 2026-07-16
**대상:** 지사네 turborepo — 3앱(admin/owner/partner) + `packages/shared`·`packages/ui`. TS/TSX 152파일 ≈ 16,000라인, SQL 마이그레이션 19, 토스페이먼츠 에스크로 결제.
**기준:** Claude Code 글로벌 규칙(`~/.claude/rules/`) — `security` · `quality-gates` · `golden-principles` · `coding-style` · `ui-ux-design` · `dev-deploy-workflow` · `quality-model`(ISO/IEC 25010).
**성격:** **진단 전용.** 이 문서는 검수 결과 기록이며, **코드는 한 줄도 수정하지 않았다.** 조치는 별도 계획(`/plan`) 승인 후 진행.

---

## 0. 검증 한계 (먼저 밝힘)

- **정적 판독만 수행.** 저장소에 의존성이 설치돼 있지 않아(`node_modules` 부재) **tsc·lint·build·test를 실행하지 못했다.** 아래 모든 항목은 "코드가 그렇게 쓰여 있다"의 정적 확정이지, "런타임에 그 버그가 실제로 발현한다"의 재현이 아니다.
- **C1(시드 마이그레이션)의 관건은 prod 적용 여부**인데, 이는 실제 DB/마이그레이션 이력을 봐야 확정된다. 이 문서 범위 밖.
- 각 항목에 **검증 상태**를 명시한다:
  - ✅ **직접확인** — 검수자가 해당 파일·라인을 직접 읽어 재현함
  - ⚠️ **보고만** — 병렬 검수 에이전트가 보고했으나 검수자가 개별 재확인하지 않음
  - ❌ **미재현** — 에이전트가 보고했으나 검수자의 재확인에서 재현되지 않음(주장 보류)

---

## 1. 검수 방법론

글로벌 규칙 파일이 정의하는 축별로 **병렬 검수 에이전트 4대**를 띄우고(이 PC의 `agents-v2.md` 병렬 멀티퍼스펙티브 원칙 근거), 각 보고의 **최우선 항목을 검수자가 코드로 직접 재검증**했다.

| 축 | 근거 규칙 | 범위 |
|---|---|---|
| 보안 | `security.md`, `quality-gates §3`, 25010 #6 | 시크릿·접근제어(OWASP #1)·웹훅 무결성·입력검증·RLS·service_role |
| 코딩스타일/골든원칙 | `coding-style.md`, `golden-principles.md`, 25010 #7 | 불변성·파일/함수크기·에러핸들링·console·하드코딩 |
| UI/UX 8렌즈 | `ui-ux-design.md`, `quality-gates §1` | 상태·계층·피드백·일관성·접근성(WCAG AA)·카피·크래프트·노력 |
| 배포/env/정합성 | `dev-deploy-workflow.md`, `deploy-platform-selection.md`, 25010 #3·5·8 | 하드코딩 prod값·env검증·마이그레이션 안전성·외부호출 신뢰성·N+1·CI |

---

## 2. 종합 결론

**확정 CRITICAL 0건.** **핵심 결제 로직의 설계는 탄탄하다**(체크아웃 소유권검증·웹훅 HMAC 서명·금액 서버측 산출·전 테이블 RLS·service_role 격리). 위험은 두 곳에 집중된다: ① **결제·에스크로 경로의 "성공 후 처리 / 멱등성 / 확인단계" 공백**, ② **시드 마이그레이션의 prod 데이터 파괴 가능성.** 나머지는 환경 이동성(하드코딩 prod값)과 유지보수성(중복·삼킨 에러) 수준.

---

## 3. HIGH — 결제·데이터 무결성 (교차검증됨)

여러 축의 에이전트가 **독립적으로 같은 지점을 지목**했고, 검수자가 직접 재확인함.

### H-1 · 시드 마이그레이션이 prod 데이터를 파괴할 수 있음 ✅
- **위치:** `supabase/migrations/0014_diversify_seed_status.sql:19-20` (및 `0013`/`0015`/`0018` 시드 700건)
- **근거(직접 읽음):** 19행 `UPDATE request SET created_at = now() - (…랜덤…)` 에 **`WHERE` 절이 없다.** 실 request 행이 있는 DB에 실행되면 **모든 행의 생성시각을 비가역 덮어쓴다.** 7–16행은 실 `open` 의뢰를 `closed`/`matching`으로 뒤집는다. 시드 700건도 마이그레이트 시 prod에 삽입된다.
- **규칙:** dev-deploy-workflow(마이그레이션 additive·reversible, 라이브 데이터 무손실).
- **권장:** 시드/데모 뮤테이션(0013–0018)을 스키마 마이그레이션 파이프라인에서 분리해 **env-가드 시드 스크립트**로 이동. (위험 대비 변경범위가 작아 최우선 조치 후보.)

### H-2 · 웹훅: 캡처 성공 후 DB 기록 실패 미확인 + 멱등성 없음 ✅
- **위치:** `apps/owner/app/api/payments/webhook/route.ts:77-94`
- **근거(직접 읽음):** 71행 토스 `confirmPayment`(자금 캡처) 성공 후, 77–84행 `settlement→deposited`·87–92행 `deal→working` 업데이트의 **에러를 체크하지 않고** 94행에서 `{success:true}` 반환. 캡처 후 DB 쓰기가 실패해도 토스는 200을 받아 **재전송하지 않는다 → 자금은 캡처됐으나 에스크로 미기록.** 또한 확정 전 `settlement.escrow_status`를 확인하지 않아 **멱등하지 않다** — 중복 이벤트는 73행에서 500을 반환해 **토스 재전송 루프**를 유발.
- **양호(직접 확인):** HMAC-SHA256 서명검증 존재(22–28행), 확정 금액은 `deal.total_pay` 서버측 산출(71행) — **금액 위변조는 불가.**
- **규칙:** quality-gates §2(A10 예외처리, 금액경로 무손실), 결제 멱등성.
- **권장:** 확정 전 `escrow_status`/`paymentKey` 멱등가드로 이미 처리된 건은 200 단락; 각 DB 업데이트 에러 체크 후 실패 시 non-2xx 반환.

### H-3 · 환불/해제: 정적 공유시크릿 단일보호 + 레이트리밋·멱등키 없음 ✅
- **위치:** `apps/owner/app/api/settlements/[id]/refund/route.ts:19`, `release/route.ts:17`
- **근거(직접 읽음):** 실제 토스 `cancelPayment`(환불)와 에스크로 상태변경·보증금 원장 기록을 수행하는 경로가 `adminSecret !== process.env.ADMIN_SECRET` **단일 정적 헤더**로만 인가된다. `verifyAdmin()`(Supabase 신원+`ADMIN_EMAILS`) 미사용, per-admin 귀속·회전 불가, 타이밍-세이프 비교 아님, **레이트리밋 없음.** 시크릿 유출 시 임의 환불·보증금 고갈. DB 업데이트 전 토스 취소 호출 + 멱등키 없음 → 재시도 시 **이중환불** 위험.
- **규칙:** security(접근제어·레이트리밋), 결제 멱등성.
- **권장:** `verifyAdmin()` 신원인증으로 교체(같은 저장소 `admin/lib/admin/actions.ts`의 `releaseSettlement`는 이미 이 방식) + 레이트리밋 + 멱등마커.

### H-4 · fail-open 소유권 검사 (중복 REST 라우트) ✅
- **위치:** `apps/{owner,partner}/app/api/deals/[id]/approve/route.ts:31`, `confirm/route.ts:31`
- **근거(직접 읽음):** 31행 `if (deal.request_id) { … }` 가 소유권 검사 **전체를 감싼다.** `deal.request_id`는 nullable(`0001_init.sql:86`)이라, null인 deal은 검사를 건너뛰고 55행 업데이트로 낙하 — **임의 인증사용자가 타인 deal을 `working`으로 구동 가능.** 추가로 38행 `if (request)`도 같은 구조여서 조회 실패 시에도 스킵되는 **이중 fail-open.**
- **노출도:** 현재 모든 deal은 매칭 수락으로 `request_id`가 채워져 **즉시 악용은 불가**(잠재). 라이브 UI는 안전한 서버액션(`deal-operations.ts`의 `verifyDealOwnership`, `!inner` 조인으로 fail-closed)을 사용 — 이 REST 라우트들은 **중복/레거시.**
- **규칙:** OWASP #1 Broken Access Control(fail-closed 원칙).
- **권장:** 중복 라우트 4개 **삭제**(안전한 서버액션이 이미 UI 커버). 유지한다면 fail-closed로 반전 + `request_id` NOT NULL화 검토.

### H-5 · critical-path 에러 삼킴 + 롤백 누락 ✅
- **위치:** `apps/partner/lib/matching/actions.ts:134-136`
- **근거(직접 읽음):** `deal_workflow` 5행 insert 실패를 **`console.error`만** 하고 148행 `redirect('/work/{id}')`로 성공 처리 → **워크플로 0행 deal 생성**(작업 페이지 파손). 바로 위 116–122행 settlement 분기는 deal 삭제+matching 롤백을 **하는데 여기만 누락**(대조 확인).
- **규칙:** golden-principles #10, quality-gates §2(에러 무시 금지).
- **권장:** settlement 분기처럼 롤백 후 에러 반환.

### H-6 · 워크플로 단계 라벨 3곳 불일치 (역할별 표기 상이) ✅
- **위치:** `packages/shared/lib/labels.ts:32` vs `apps/partner/app/(main)/work/[id]/workflow-form.tsx:8` vs `packages/ui/components/workflow-checklist.tsx:4`
- **근거(직접 읽음):** shared `intake:'요건 파악'`, 로컬 2곳 모두 `intake:'요건 수집'`. **동일 단계를 고객은 "요건 파악", 파트너는 "요건 수집"으로 본다.**
- **규칙:** ui-ux-design(일관성·공유 라벨맵), coding-style(중복 금지).
- **권장:** 로컬 2개 제거하고 `@jisane/shared/labels`의 `WORKFLOW_STEP_LABELS`로 통일.

> **참고 — 결제 신뢰성 문제군:** H-2·H-3와 아래 M-8(`/api/payments/success`·`fail` 라우트 부재)은 사실상 하나의 문제군이다: **성공 후 상태기록·멱등성·리다이렉트 종단이 미완.**

---

## 4. MEDIUM

### 환경 이동성 / 배포
- **M-1 · prod URL 폴백 17곳 ✅** — `process.env.NEXT_PUBLIC_* || 'https://…jisane.cloud'` 패턴이 **17개소**(에이전트 ~14 과소보고)에 하드코딩. env 미설정 프리뷰/스테이징 빌드가 **prod 링크를 빌드타임에 구움.** → 전 빌드환경에 env 설정 + 리터럴 폴백 제거, `packages/shared`에 `getAppUrls()` 단일화.
- **M-2 · 쿠키 도메인 하드코딩 ✅** — `packages/shared/lib/supabase/server.ts:26` `NODE_ENV==='production' ? '.jisane.cloud' : undefined`. prod 외 도메인 배포 시 로그인 조용히 깨짐. → `process.env.COOKIE_DOMAIN`.
- **M-3 · OAuth redirectTo 폴백 ✅** — `packages/shared/lib/auth/actions.ts:11,31` `NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'`. 배포 빌드서 var 누락 시 localhost로 리다이렉트. → var 필수화(미설정 시 throw).
- **M-4 · Docent 임베드 호스트 하드코딩 ✅** — 3개 `layout.tsx:70`에 Cloud Run `*.run.app` 호스트 3중 하드코딩. 서드파티 임베드라 허용 가능하나 자동생성 호스트라 이전 시 취약. → `NEXT_PUBLIC_DOCENT_EMBED_URL` 단일화.
- **M-5 · 브라우저 Supabase 클라이언트 검증 없음 ✅** — `packages/shared/lib/supabase/client.ts:7` `createBrowserClient(supabaseUrl!, supabaseKey!)` 비-null 단언만, server/admin과 달리 throw 가드 없음. → 동일 throw 가드 추가.
- **M-6 · 결제 URL의 SITE_URL 미검증 ✅** — `packages/shared/lib/payment.ts:42-43` `${process.env.NEXT_PUBLIC_SITE_URL}` 무검증 보간. 미설정 시 토스에 `undefined/api/...` 전달. → 페이로드 생성 전 검증.

### 정합성 / 신뢰성
- **M-7 · zod 부재 ✅** — 전 패키지에 zod 미설치. 9개 라우트가 `await request.json()` 후 `any` 수기검증. 예: `apps/owner/app/api/requests/route.ts:77` `budget_hope ? parseInt(budget_hope,10) : null` **NaN 가드 없음**(`"abc"`→NaN→DB). → 라우트별 zod 스키마.
- **M-8 · `/api/payments/success`·`fail` 라우트 부재 ✅** — `payment.ts:42-43`이 없는 라우트로 리다이렉트. `api/payments/`엔 `checkout`·`webhook`만 존재 → 토스 리다이렉트가 404. 결제확정이 웹훅에만 의존. → 라우트 추가.
- **M-9 · CI 게이트 부족 ✅** — `.github/workflows/ci.yml`은 `turbo run build`만. **lint·test·독립 typecheck 스텝 없음**(결제 코드 무테스트). 38행은 실패해도 "✅ 3 apps built successfully" 출력. → lint/typecheck/test 잡 추가.
- **M-10 · 추가 삼킨 에러 2건 ✅** — `matching/actions.ts:144`(request status 갱신 실패 무시 → 재매칭 이중예약 가능), `deal/deal-operations.ts:66`(deal은 `done`인데 `settlement→reviewing` 실패 무시 → 상태 괴리). → 반환/보상 처리.
- **M-11 · 0007 drop constraint 비멱등 ✅** — `supabase/migrations/0007_owner_engagement.sql:4` `drop constraint …`(`if exists` 없음) → 재실행 실패. → `drop constraint if exists`.

### 유지보수성 / UI
- **M-12 · 대형 파일/함수 ✅(부분)** — `apps/admin/lib/admin/actions.ts` **569라인**(직접확인, 400 초과 유일 비생성 파일). 50줄 초과 함수: `matching-algo.ts:45 findCandidates`(≈143라인·5중첩), `admin/actions.ts getCandidatesForRequest`(≈124라인), `matching-tab.tsx MatchingTab`(≈248라인), `review-algo.ts calculateAiRating`(≈85라인) — ⚠️보고만(라인 미개별확인). `landing-stats.ts:92-103 vs 172-183` 카테고리 트리 빌드 블록 중복 ⚠️. → 관심사별 분할 + `buildCategoryCounts` 추출.
- **M-13 · 공유 UI 프리미티브 부재 ✅** — `packages/ui/components/`엔 `print-button`·`submit-button`뿐, 범용 Button/Input/Card/Badge 없음 → 버튼·입력·카드·상태색맵이 ~20파일에 수기 중복. → `@jisane/ui`로 추출.
- **M-14 · 메시지 입력 aria-label 누락 (WCAG AA) ✅** — `apps/owner/.../message-thread.tsx:101`·`apps/partner/.../message-thread.tsx:94`는 placeholder만. **admin `progress-tab.tsx:219`엔 `aria-label` 존재** — 패턴은 있으나 사용자앱 2곳에 미적용. → `aria-label="메시지 입력"` 추가.
- **M-15 · 재무적 비가역 액션 무확인 ⚠️/✅** — `apps/owner/.../inspection-section.tsx:56`(에스크로 해제)·`quote-section.tsx:92`(결제 커밋)가 확인단계 없음(⚠️보고만). 파트너 `matching-actions.tsx`의 `rejectMatching`(거절)도 `confirm()` 래핑 없이 즉시 실행(✅직접확인, 26행). → 확인 다이얼로그.
- **M-16 · 파트너 필드 분류 불일치 ⚠️** — 등록 28필드 vs 프로필편집 13칩, 선택필드가 편집서 실종 가능(에이전트 보고, 미재확인). → `categories.ts` 단일소스.
- **M-17 · 존재하지 않는 Tailwind 토큰 (죽은 호버) ✅** — `apps/owner/app/(main)/request/page.tsx:71` `hover:bg-surface-hover` 참조. globals.css는 `--surface`·`--surface-warm`만 정의, `--surface-hover` **없음** → 대분류 탭 호버 피드백 무효(죽은 클래스). → `hover:bg-surface-warm`으로 수정(1줄, 최저비용).
- **M-18 · Toss fetch 타임아웃/재시도 없음 (금액경로 신뢰성) ✅** — `packages/shared/lib/payment.ts:31,67,98` 3개 fetch(생성/확정/취소) 모두 `AbortController`/`AbortSignal.timeout` 없음. 토스 연결 지연 시 플랫폼 타임아웃까지 요청 정지, 재시도 정책 없음. → `AbortSignal.timeout(…)` + 멱등 GET/confirm에 바운드 재시도.
- **M-19 · 레이트리밋 전무 ✅/⚠️** — 환불/해제 경로(✅직접확인, H-3)에 레이트리밋 없음. 에이전트 보고상 웹훅·체크아웃·inquiry·OAuth 콜백 등 **전 엔드포인트에 레이트리밋 없음**(⚠️타 라우트 미개별확인). → 웹훅·체크아웃·시크릿가드 라우트에 레이트리밋(edge middleware/Upstash).
- **M-20 · 폼 dirty-state 가드 전무 ✅** — 저장소 전체에 `beforeunload`/`isDirty`/unsaved 가드 **없음**(직접확인). 긴 의뢰 등록·프로필 편집 등에서 이탈 시 입력 조용히 소실. → dirty 시 이탈 경고.

---

## 5. LOW

- **L-1 · 0017 volatile default 테이블 재작성 ✅** — `0017_missing_triggers.sql:8,13` `ADD COLUMN … NOT NULL DEFAULT now()`. `now()`는 volatile이라 ACCESS EXCLUSIVE 락으로 테이블 재작성. 현 소규모 AI 테이블선 무해, 대형 테이블선 위험.
- **L-2 · console.error 6개 ✅(일부)** — 관측 계층 없이 `console.error` 잔존(다수가 위 삼킨 에러와 동반). → 로거 도입.
- **L-3 · inquiry INSERT RLS 저자 스푸핑 ⚠️** — `0001_init.sql:192` `with check (author_id is not null)` 로 임의 `author_id` 삽입 가능(저민감·앱 경유는 서버산출). → 호출자 id로 스코프.
- **L-4 · 타이밍-비세이프 시크릿 비교 ✅** — 웹훅 서명·`x-admin-secret` 모두 `!==`. → `crypto.timingSafeEqual`.
- **L-5 · magic number ⚠️** — `matching-algo.ts` 점수(15/8/5/3…), 기간 리터럴(`24*60*60*1000` 등) 명명 권장.
- **L-6 · 다크모드 미지원 ✅** — `globals.css`에 `prefers-color-scheme`/`data-theme`/`dark:` 오버라이드 **없음**(직접확인). 단일 라이트 테마. ui-ux-design은 다크 지원을 기본 요구하나 **의도적 제품 선택일 수 있음** — 결정 문서화 또는 다크 토큰 추가.
- **L-7 · 대시보드 탭 ARIA 시맨틱 부재 ✅** — `apps/admin/.../dashboard-tabs.tsx`가 일반 버튼, `role="tablist"`/`role="tab"`/`aria-selected` 및 화살표키 내비 없음(직접확인). → ARIA 탭 시맨틱 추가.
- **L-8 · 기타(⚠️ 보고만, 미개별확인)** — `inquiry-tab.tsx:36-43` 성공 시에만 렌더하고 에러 무피드백; 3개 `layout.tsx`의 `metadataBase` prod 호스트 하드코딩(SEO 표준, 저위험); `settlements/[id]/release·refund`의 `guarantee_fund_ledger` insert 미체크(원장 드리프트); `.github/workflows/ci.yml:18-19` CI 플레이스홀더 시크릿(비기능 더미, 정보성); `status/page.tsx` 등 `|| req.status` 폴백이 미매핑 시 raw enum 노출 가능(현재 맵 완전).

---

## 6. 규칙 대비 양호 항목 (검증된 네거티브)

- ✅ **RLS 전 민감테이블 활성, `USING(true)` 남용 0**(보안 에이전트 보고 + 정책 구조 확인). `guarantee_fund_ledger`는 deny-all + service_role만.
- ✅ **체크아웃 안전** — 소유권 `client.auth_user_id===user.id` 검증, 금액 `deal.total_pay` 서버측(에이전트 보고).
- ✅ **웹훅 HMAC-SHA256 서명검증 존재**(직접확인) — 멱등성만 결여(H-2).
- ✅ **service_role 키 클라이언트 번들 도달 불가**, env 미설정 시 throw(에이전트 보고).
- ✅ **SQL 인젝션 0**(전부 Supabase 파라미터라이즈드), **XSS 0**(`dangerouslySetInnerHTML` 없음), **PII/토큰 로깅 0**(에이전트 보고).
- ✅ **불변성 완전 통과**(파라미터/공유상태 변형 0), **serverless fs 오남용 없음**, **N+1 쿼리 없음**(`.in()` 배치·`Promise.all` 사용).
- ✅ **상태처리(loading/empty/error/data) 커버리지·한국어 카피 우수**(에이전트 보고).
- ✅ **800줄 초과 파일 0**(직접확인).

---

## 7. 미재현 / 보류 항목 (정직성 표기)

- ❌ **이모지를 chrome 아이콘으로 사용(admin 대시보드)** — UI 에이전트가 👥⏳💰 등을 보고했으나, 검수자의 재확인 grep에서 **admin 대시보드 `.tsx`에 이모지 미발견**(`icon.jpg` 바이너리만 매치). **주장 보류** — 이미 제거됐거나 오탐 가능. 조치 전 재확인 필요.
- ⚠️ 위 4·5절의 ⚠️ 표시 항목(M-15, M-16, M-12 함수크기, L-3, L-5 등)은 에이전트 보고에 근거하며 검수자 개별 재확인 미완. 조치 착수 시 재검증 요망.

---

## 8. 권장 조치 순서

1. **H-1** — 시드 마이그레이션(0013–0018) 파이프라인 분리. *(위험 대비 변경범위 최소, 최우선.)*
2. **H-2 + H-3 + M-8** — 결제 신뢰성 묶음: 웹훅 멱등가드+DB에러 체크, 환불/해제 `verifyAdmin`+레이트리밋+멱등키, success/fail 라우트 추가.
3. **H-4** — 중복 deal 라우트 4개 삭제.
4. **H-5 + M-10** — 삼킨 critical-path 에러 롤백/보상.
5. **H-6** — 워크플로 라벨 통일.
6. **MEDIUM 정리** — URL폴백·쿠키도메인·SITE_URL env화(M-1~M-6), zod 도입(M-7), CI 게이트 추가(M-9), aria-label(M-14).

> **HARD-GATE:** 3+파일·결제 로직 변경은 착수 전 `/plan` 계획 승인 필수. 특히 결제 경로(H-2/H-3)는 스테이징 검증 병행.

---

*검수 방식: 규칙 축별 병렬 검수 에이전트 4대 → 검수자가 최우선 항목을 코드로 직접 재검증. 정적 판독 한정(빌드/런타임 미실행). 이 문서는 진단 기록이며 코드 변경 없음.*
