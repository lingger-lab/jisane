# 지사네 스테이징 환경 셋업 가이드

> **목적.** RPC 사가·보안 하드닝·E2E 실행 등 "로컬로 검증 불가한 작업"을 프로덕션에 넣기 전에
> 안전하게 검증할 스테이징 환경을 구성한다. (근거: dev-deploy 규율 — 스토리지·결제·OAuth·공유쿠키는
> 스테이징에서만 진짜로 검증된다.) 이 문서는 김동현 대표의 세부 정리·검증 착수 기준점이다.

## 0. 왜 필요한가 (로컬로 안 되는 것)
- **`.jisane.cloud` 공유쿠키** — 로컬 localhost 서브도메인(포트만 다름)은 쿠키 공유 불가 → 3앱 세션 연동·회원전환 재현 불가.
- **OAuth 콜백**(`exchangeCodeForSession`) — 카카오/구글 실 리다이렉트 필요.
- **토스페이먼츠 PG·웹훅** — test PG + 실제 서명 웹훅 수신.
- **RPC 트랜잭션** — 재무 로직(딜 생성)은 실 DB에서 트랜잭션·롤백을 검증해야 안전.

## 1. 스테이징 Supabase 프로젝트 (프로덕션 복제, 값만 다름)
1. **새 Supabase 프로젝트** 생성 — 리전 **Seoul(ap-northeast-2)** 고정(PIPA).
2. 마이그레이션 **순서대로 전량 적용**: `supabase/migrations/0001…0042`. (SQL Editor 또는 `supabase db push`)
   - 0042(유니크 인덱스)는 시드 중복이 있으면 실패 → 사전 dedup(리뷰 §정합성 SQL) 후 적용.
3. 시드: `0013`/`0020` 시드는 데모 데이터. E2E 격리를 위해 **접두 `e2e_`** 팩토리로 별도 생성 권장(시드와 충돌 방지).
4. **Auth → URL Configuration → Redirect URLs**에 스테이징 3앱 콜백 등록:
   ```
   https://owner.staging.jisane.cloud/callback?join=1
   https://expert.staging.jisane.cloud/callback?join=1
   https://owner.staging.jisane.cloud/callback
   https://expert.staging.jisane.cloud/callback
   https://staging.jisane.cloud/partner/callback
   ```
   (또는 `/callback**` 와일드카드) — 미등록 시 가입 전체 파손.
5. **카카오/구글 OAuth 앱**에 스테이징 콜백 도메인 추가(각 개발자 콘솔).

## 2. Vercel 스테이징 배포 (3앱)
- 방법 A(권장): 별도 브랜치(`staging`)를 각 Vercel 프로젝트의 **프리뷰**로 연결하거나, 전용 스테이징 프로젝트 3개.
- 도메인: `owner.staging.jisane.cloud` · `expert.staging.jisane.cloud` · `staging.jisane.cloud`(admin).
- **환경변수(스테이징 값)** — 프로덕션과 **키만 다르게**:
  | 변수 | 스테이징 값 |
  |---|---|
  | `NEXT_PUBLIC_SUPABASE_URL` | 스테이징 Supabase URL |
  | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 스테이징 anon 키 |
  | `SUPABASE_SECRET_KEY` | 스테이징 서비스롤 키 (**프로드 키와 분리**) |
  | `NEXT_PUBLIC_SITE_URL` | 각 앱 스테이징 오리진 |
  | `NEXT_PUBLIC_OWNER_URL`/`EXPERT_URL`/`ADMIN_URL` | 스테이징 오리진들 |
  | `ADMIN_EMAILS` | 테스트 관리자 이메일 |
  | 토스 키(clientKey/secretKey) | **test 모드 키** |
  | `ADMIN_SECRET` 등 | 스테이징 전용 값 |
- **주의**: 프로덕션 시크릿을 스테이징에 절대 재사용 금지(폭발반경 분리). `NEXT_PUBLIC_*`는 빌드타임 인라인 → 값 변경 시 재빌드.

## 3. 토스페이먼츠 (test)
- 토스 대시보드에서 **test clientKey/secretKey** 발급 → 스테이징 env.
- **웹훅 URL** 등록: `https://owner.staging.jisane.cloud/api/payments/webhook` (서명 검증 경로).
- test 카드로 결제 → 웹훅 수신 → settlement escrow 흐름 확인.

## 4. 이 스테이징에서 검증할 "이관 항목" (→ 김동현 대표)
1. **RPC 사가** (딜 생성 트랜잭션화) — `create_deal_from_matching`/`create_deal_from_invitation` plpgsql 작성 → 스테이징 적용 → 이중수락·부분실패·롤백 시나리오 검증 후 프로드 승격. 앱 코드는 acceptMatching/acceptInvitation을 RPC 호출로 전환(수수료는 TS 계산값을 파라미터로 전달).
2. **보안 하드닝** — ①레이트리밋(인프라 선택: upstash 등) ②API 인가 통일(x-admin-secret→세션 verifyAdmin, 외부/크론 호출자 확인) ③CSRF Origin/Sec-Fetch-Site 검증(웹훅 제외) ④탈퇴 익명화 범위(메시지/문의 정책) — 스테이징에서 결제·인가 회귀 없음 확인 후 반영.
3. **E2E 실행** — `e2e/README.md`의 Playwright 스위트를 스테이징 대상으로 실행. `@smoke`(가입·매칭·결제)를 배포 전 게이트로.

## 5. 승격(프로모션) 규율
`로컬(green) → 스테이징(통합·검증) → 프로덕션`. 마이그레이션은 스테이징 먼저(additive·reversible),
롤백 경로 확인 후 프로드. 배포는 게이트 통과분만. 프로덕션은 실험장이 아니다.

## 5-1. 바로 쓰는 스크립트
- **스키마 검증** — 마이그레이션 적용 후 `scripts/staging/verify-schema.sql`을 SQL Editor에서 실행
  → 0039~0042(withdrawn enum·탈퇴 컬럼·real_name·백스톱 유니크 인덱스) 반영 확인.
- **배포 후 스모크** — `OWNER=… EXPERT=… ADMIN=… bash scripts/staging/smoke-check.sh`
  → 3앱 도달성 + 공개 라우트 + 감지 마커 자동 점검(로그인/결제는 E2E로).

## 6. 스모크 체크리스트 (스테이징 배포 후)
- [ ] 3역할 가입(/join) × 카카오·구글 = 6조합
- [ ] 회원전환(부족정보만 입력) · 탈퇴 → 재로그인 → 재활성
- [ ] 의뢰→매칭→수락→deal→입금(test)→정산 release
- [ ] 전문서비스 주문 + 3자 메시지(IDOR 차단)
- [ ] 관리자 회원관리(상세·역할부여·강제탈퇴, 비관리자 차단)
- [ ] status 게이트(탈퇴 세션 액션 거부)
