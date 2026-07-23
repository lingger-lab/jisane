# 코드베이스 감사 대응 — 검증·수정 내역

**작업일:** 2026-07-23
**기준 문서:** `07_CODEBASE_AUDIT_2026-07-16.md` (검수일 7/16)
**작업 방식:** 감사 항목 전수를 현재 코드 기준으로 재검증(정적 판독) → 타당 항목 수정 → `turbo lint`(에러 0) + `turbo build`(3앱 타입체크 포함 통과) + 프로덕션 모드(`next start`) 스모크 테스트로 검증.

## 0. 검증 컨텍스트

감사(7/16) 이후 **v2 전면 전환**이 있었다: `client→owner`, `partner→expert` 개명(`apps/partner`→`apps/expert` 포함), `0019_v2_full_reset.sql`(전체 DROP+재생성), `0020_v2_seed.sql`. 감사 문서의 파일 경로 다수가 이동했으나, **지적된 문제 구조 자체는 대부분 새 경로에 그대로 존재**함을 라인 단위로 재확인했다.

## 1. 수정 완료 — HIGH

| 항목 | 검증 결과 | 조치 |
|---|---|---|
| **H-2** 웹훅 멱등성·캡처 후 DB 실패 미확인 | 유효 | `apps/owner/lib/payments/confirm-deposit.ts` 신설(공통 확정 로직): settlement가 `pending`이 아니면 성공 단락(멱등), Toss `ALREADY_PROCESSED_PAYMENT`는 캡처 완료로 간주, 캡처 후 DB 기록 실패는 non-2xx 반환(Toss 재전송 유도). 웹훅이 이를 사용 |
| **H-3** 환불/해제 정적 시크릿 단일보호·이중환불 | 유효 | refund: 타이밍세이프 비교 + `ADMIN_SECRET` 미설정 시 500 + Toss 취소 멱등키(`refund_{settlementId}_{누적액}`) + 원장 insert 에러 체크. **release 라우트 삭제** — 호출처 0, admin 서버액션 `releaseSettlement`(이의제기 가드 보유)와 중복이며 그 가드를 우회하는 경로였음 |
| **H-4** fail-open 소유권 검사 REST 라우트 | 유효 | owner·expert의 `api/deals/[id]/approve`·`confirm` **4개 삭제**. 호출처 0(UI는 fail-closed인 `deal-operations.ts` 서버액션 사용) |
| **H-5** acceptMatching workflow insert 실패 삼킴 | 유효 | 실패 시 deal 삭제(settlement/workflow는 `ON DELETE CASCADE`) + matching `proposed` 원복 + 에러 반환 |
| **H-6** 워크플로 라벨 3곳 불일치 | 유효 | 로컬 맵 2곳(`workflow-checklist.tsx`, `workflow-form.tsx`) 제거, `@jisane/shared/labels`의 `WORKFLOW_STEP_LABELS`("요건 파악")로 통일 |

## 2. 수정 완료 — MEDIUM/LOW

- **M-8** `/api/payments/success`·`fail` 라우트 부재 → **신설**. success는 공통 확정 로직으로 멱등 승인 후 `/status/{requestId}?success=payment` 리다이렉트, fail은 자금 이동 없이 `?error=payment_failed` 리다이렉트
- **M-10** 추가 삼킨 에러 → acceptMatching의 request status 갱신 실패 시 전체 롤백; `confirmDealOp`의 settlement 갱신 실패 시 deal을 `working`으로 되돌리는 보상 처리 후 에러 반환
- **M-2** 쿠키 도메인 하드코딩 → `COOKIE_DOMAIN` env 오버라이드(3앱 proxy.ts + shared server.ts, 기존 폴백 유지)
- **M-3** OAuth redirectTo localhost 폴백 → prod에서 `NEXT_PUBLIC_SITE_URL` 미설정 시 throw(dev만 localhost 허용)
- **M-5** 브라우저 Supabase 클라이언트 → server/admin과 동일한 env throw 가드 추가
- **M-6** 결제 URL SITE_URL 미검증 → `createCheckoutSession` 진입 시 검증·throw
- **M-18** Toss fetch 타임아웃 → 생성/확정/취소 3종에 `AbortSignal.timeout(15s)` (재시도 정책은 미도입 — 멱등키가 재시도 안전성 보완)
- **M-7(부분)** `budget_hope` NaN 가드 → `Number.isSafeInteger` + 음수 거부(zod 전면 도입은 보류)
- **M-9** CI 게이트 → lint 스텝 추가, 실패해도 "✅ built successfully"를 찍던 Summary를 성공/실패 분기로 수정
- **M-11** `0007` drop constraint → `if exists` 멱등화
- **M-14** 메시지 입력 aria-label → owner·expert 2곳 추가
- **M-15** 비가역 액션 확인 다이얼로그 → 견적 승인(금액 표시), 검수완료(정산 안내), 매칭 거절 3곳 `confirm()` 추가
- **M-17** 죽은 토큰 `hover:bg-surface-hover` → `hover:bg-surface-warm`
- **L-4** 타이밍세이프 비교 → 웹훅 서명·refund 시크릿 모두 `crypto.timingSafeEqual`

### 감사 외 발견·수정

- **루트 `eslint.config.mjs`의 ignore가 `apps/*/.next`에 미적용** — `.next/**` → `**/.next/**` 등으로 수정. 이 버그로 생성 파일이 lint되어 8,533건이 보고되던 것이 0건으로 정리됨
- lint 게이트 통과를 위해 앱 코드의 기존 `no-explicit-any` 에러 11건(마이페이지·disputes·refund·admin actions), `prefer-const` 2건, `react-hooks/purity` 1건(동적 서버 컴포넌트의 `Date.now()` — 사유 명시 disable) 정리

## 3. 기각 — 전제 변경

- **H-1 (시드 마이그레이션 prod 파괴)**: `supabase/MIGRATION_NOTES.md`가 "테스트 데이터만 존재 → full reset 채택"을 명시. `0019`가 전체 DROP 후 재생성하므로 0013–0018 분리는 실익 없음. **prod에 실데이터가 생긴 이후에는 이 전제가 무효화되므로, 그 시점부터는 추가 마이그레이션을 additive로만 작성할 것.**

## 4. 미수정 — 사유와 권고

| 항목 | 사유 | 권고 |
|---|---|---|
| M-1 prod URL 폴백 17곳 | 동작 보존 리팩터(중앙화)일 뿐, 실위험은 배포 환경 env 설정 규율의 문제 | 프리뷰/스테이징 도입 시 `getAppUrls()` 중앙화 + env 필수화 |
| M-7 zod 전면 도입 | 신규 의존성 추가 결정 필요 | 라우트 입력 검증 표준화 시점에 도입 |
| M-12/M-13 대형 파일·공유 UI 부재 | 대형 리팩터 | 별도 계획으로 진행 |
| M-16 파트너 필드 분류 불일치 | 감사 자체가 미재확인(⚠) | 조치 전 재검증 필요 |
| M-19 레이트리밋 전무 | edge middleware/Upstash 등 인프라 결정 필요 | 결제·시크릿 라우트부터 도입 |
| M-20 dirty-state 가드, L-6 다크모드, L-7 ARIA 탭 | 제품/UX 결정 영역 | 백로그 관리 |
| L-1, L-2, L-3, L-5, L-8 | 저위험·관측/스타일 수준 | 로거 도입 시 일괄 처리 |

## 5. 검증 기록

- `npx turbo run lint` — **3앱 에러 0** (경고 7건: 미사용 import 4, 커스텀 폰트 3 — 기존 항목)
- `npx turbo run build --force` — **3앱 컴파일+타입체크 통과**
- 프로덕션 스모크(`next start`): 3앱 랜딩 200 / `payments/fail` → `?error=payment_failed` 리다이렉트 정상 / `payments/success` 파라미터 결손 → `?error=payment_invalid` / 웹훅 무서명 POST 401 / `/api/requests` 비인증 401
- 삭제 라우트(approve/confirm×4, release)가 빌드 라우트 목록에서 제거됨을 확인
