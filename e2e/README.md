# 지사네 E2E 테스트 (Playwright)

> **상태: 스캐폴딩.** 구조·인증우회·팩토리·스모크 스펙 골격을 제공한다. 실제 실행은
> **스테이징 환경**(별도 Supabase 프로젝트 + Toss test key + 3앱 배포)에서만 가능하다 —
> 로컬 localhost는 서브도메인 공유쿠키·OAuth 콜백·토스 PG를 재현하지 못한다(dev-deploy 규율).
> CI는 GitHub Actions 무료분 소진 상태라 **로컬/수동 실행** 우선.

## 왜 스테이징인가
- `.jisane.cloud` **공유쿠키**: 로컬 localhost 서브도메인(포트만 다름)은 쿠키 공유가 안 됨.
- **OAuth 콜백**(`exchangeCodeForSession`)·**토스 PG**: 목킹 불가, 실제 프로바이더 필요.
- 그래서 3앱을 스테이징 도메인(예: `*.staging.jisane.cloud`)에 올리고, 아래 env로 실행.

## 실행
```bash
# 루트에서
npm i -D @playwright/test   # 최초 1회
npx playwright install       # 브라우저 설치
# 스테이징 env 설정 후
npm run e2e            # 전체
npm run e2e:smoke      # @smoke(가입·매칭·결제)만
```

## 필요 env (스테이징)
| 변수 | 설명 |
|---|---|
| `E2E_OWNER_URL` / `E2E_EXPERT_URL` / `E2E_ADMIN_URL` | 스테이징 3앱 오리진 |
| `E2E_SUPABASE_URL` | 스테이징 Supabase URL |
| `E2E_SUPABASE_SERVICE_KEY` | 서비스롤 키(테스트 유저 생성·세션주입·팩토리·정리) |
| `E2E_SUPABASE_REF` | 프로젝트 ref(쿠키 이름 `sb-<ref>-auth-token`) |
| `E2E_COOKIE_DOMAIN` | 예: `.staging.jisane.cloud` |
| `E2E_ADMIN_EMAIL` | ADMIN_EMAILS에 포함된 관리자 이메일 |

## 인증 우회
실제 카카오/구글 대신 **Supabase Admin API로 테스트 유저 생성 + 세션 쿠키 주입**
(`fixtures/supabase-auth.ts`). 역할별 storageState를 만들어 3앱을 한 컨텍스트에서 이동.

## 시나리오(설계 — 우선순위순, `@smoke`=배포 전 최소셋)
1. `@smoke` 가입 유형강제 (미가입→/join, join=1→행생성, 기존회원 회귀)
2. 회원전환 (부족정보만 즉시전환)
3. 탈퇴→재로그인→재활성 (3역할·진행중 가드)
4. `@smoke` 매칭 풀사이클 (의뢰→후보→수락→deal→정산)
5. 초빙 사이클
6. 전문서비스 주문 + 3자 메시지 (IDOR)
7. 관리자 회원관리 (인가)
8. status 게이트 (탈퇴 세션 액션 거부)
9. `@smoke` 결제 (Toss test·웹훅 서명·멱등)

각 시나리오의 assertion·레드그린은 종합 리뷰 리포트 §3 참조.
