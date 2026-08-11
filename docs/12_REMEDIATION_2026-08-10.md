# 감사 처리 현황 (Remediation Log) 2026-08-10

> docs/10(UX)·docs/11(코드) 감사의 **처리 기록**. 감사 스냅샷 원문은 진단 기록으로 보존하고,
> 여기서 무엇을 고쳤는지·무엇을 왜 미뤘는지·감사 자체의 오류를 추적한다.
> 검증 방식: 로컬 tsc·vitest·**Docker 의사환경 마이그레이션 실적용**. 브라우저 E2E는 미실시
> (로컬 Supabase 스택 config 드리프트로 기동 불가 + 프로드 실험 금지).

## 1. 해결 완료 (커밋·푸시됨)

| 감사 항목 | 조치 | 커밋 |
|---|---|---|
| 코드 §0·P1-14/18/20/21 — 마이그레이션 0019~0023 누락 | 누락분 커밋 + **fresh-reset 차단 버그 2건 수정**(0021 enum default 캐스팅·RLS 정책 의존) | `723543e` `5fe7cf7` |
| UX P1-2 / 코드 P2-13 — service-orders 인가 부재(로그인=admin) | `isAdmin`→`verifyAdmin()`(세션+ADMIN_EMAILS) | `d104a05` |
| 코드 P1-15 — 자동정산 분쟁 조회 fail-open | error 검사·fail-closed 전환 + red-green 회귀 테스트 | `cd6ed3e` `bda6783` |
| 코드 P1-12 — settlements 수수료·자격증명 노출 | owner 응답을 안전 필드로 재구성(work_fee/match_fee/expert_id/payment_key 차단) | `7f3c771` |
| UX P1-9 / 코드 P1-11 — 로그아웃 초빙 CTA 404 | 표준 로그인 서버액션으로 교체 + 문구 일관화 | `038fe75` |
| UX P1-6/P1-10 — viewport maximumScale 핀치줌 차단(WCAG 1.4.4) | 3개 앱 maximumScale 제거 | `280ba1e` |
| 코드 P1-4/16/7/8 — 정산·수락 동시성(read-check-write race) | compare-and-set 가드 4곳 + auto-settlement CAS 테스트 | `1e85fc3` |
| 코드 P1-13 — 결제 웹훅 재진입 시 deal 미보정 | 멱등 재진입에서 deal.status 보정(CAS) | `6e6dd2c` |
| 코드 P1-5(부분) — 워크플로 전이검증 데드코드 | pending→in_progress→done 전이검증을 라이브 액션에 포팅 | `6e6dd2c` |
| 코드 P1-6 — 프로필 필드 어휘 드리프트(고아값) | FIELD_GROUPS 단일소스화(`apps/expert/lib/fields.ts`) | `6e6dd2c` |
| 코드 P1-19/P1-22 — provider·service_package RLS 자가승격·자가publish | 과다 허용 write 정책 제거(0027) — 앱은 service_role 전용 확인 | `b9eec41` |

부수 작업: vitest 도입 + 금전경로/분쟁 회귀 테스트 35건(`19b1069`), RouteLoading 기능 완결(`a24fed3`).

### 1-b. 재점검 보완 (감사 문서 전문 복원 후 — 잘렸던 detail로 드러난 누락)

감사 스냅샷이 잘려 있던 detail이 복원되면서, 위 "완료" 항목의 **서브-인스턴스 미처리**와
**오귀속 1건**이 드러나 보완했다.

| 항목 | 보완 내용 | 커밋 |
|---|---|---|
| **UX P1-8 (오귀속 정정)** | 실제 대상은 `/api/requests/[id]` — settlements(코드 P1-12)와 **다른 엔드포인트**로 미수정이었음. work_fee/match_fee 제거(total_pay만) | `7bdc887` |
| 코드 P1-7 잔여 | rejectMatching도 CAS 부재 → `.eq('status','proposed')` 추가 | `def28d1` |
| 코드 P1-8 잔여 | declineInvitation도 CAS 부재 → `.eq('status','invited')` 추가 | `def28d1` |
| 코드 P1-6 잔여 | expert_category 동기화가 미매칭 시 stale 매핑 잔존 → delete를 가드 밖으로 | `def28d1` |
| 코드 P1-12 잔여 | owner mypage도 work_fee 표시 → total_pay로 교체 | `7bdc887` |
| UX P1-3 | quote 페이지가 request_id=null 시 소유권 검증 skip(fail-open) → statement와 동일 fail-closed | `7bdc887` |
| UX P1-4 | 초빙 거절 실패 에러 삼킴(버튼 영구 '거절 중') → 에러 표시·리셋(위 decline CAS와 직결) | `7bdc887` |
| UX P1-7 / 코드 P2-21 | 검색어 PostgREST 구조문자·와일드카드 미제거로 '(주)…' 400 → `[%_,()]` strip(2개 검색) | `7bdc887` |

미처리로 남은 UX(원래 착수 안 함): P1-1(assign 버튼 in-flight 상태 부재).

### 1-c. 실행 배치 (작업계획 docs/13 착수분 — §0·A·C·D1 + 금전정합)

계획(docs/13)에 따라 우선순위대로 실행. 각 배치는 DoD(§3.5) 게이트 통과.

| 배치 | 감사 항목 | 조치 | 커밋 |
|---|---|---|---|
| §0 부분마감 | P2-50 | confirm-deposit 본경로 deal write `.eq('status','quoted')` CAS | `f79074d` |
| §0 | P3-92 | settlements `select('*')`→명시 컬럼, payment_key(PSP 자격증명) expert/owner 양쪽 제거 | `f79074d` |
| §0 | P2-33 | updateWorkflowStep `deal.status='done'` 게이트(정산·전달 후 재작성 차단) | `f79074d` |
| §0 | P2-29 | expert_category delete/insert 에러 검사·로그 | `f79074d` |
| §0(부분) | P2-21·36 | 검색 쿼리 error 서버 로그 표면화(사용자 에러 UI는 이연) | `f79074d` |
| A 보안 | P1-1·P2-7 | admin dashboard·review-input **page에 verifyAdmin()** 재검증(layout은 authz 경계 아님) | `a8034db` |
| A | P2-20·P3-44 | invitations generateMetadata 발주자 회사·대표명 인증없이 노출 → 일반 제목만 | `a8034db` |
| A | P3-36·P3-71 | requests/experts generateMetadata에 status=open/active 필터 | `a8034db` |
| A(RLS) | P2-68 | 마이그 0028 — owner_send_message에 sender_id 바인딩(발신자 위조 차단) | `464e7af` |
| A(RLS) | P2-70 | 마이그 0028 — service_package.slug 불변 트리거 | `464e7af` |
| D1 a11y | P2-47·48·P3-85 | 시맨틱 토큰(success/warning/error/text-subtle) 어둡게 → 배지·토스트 대비 AA(대비비 계산 7쌍 ≥4.5) | `03191a9` |
| 금전정합 | P3-98 | confirmDeal 보상 롤백 실패 CRITICAL 로그 + CAS | `5f88547` |
| 금전정합 | P3-104 | calcCapPricing estAmount `Math.round`(red-green 테스트 전환) | `d86c01c` |
| C 정직(3앱 21파일) | P3-14/19/56/89/93/95, P2-41/42 (+expert message/interest) | raw DB error.message → 서버 로그 + 일반 한국어 메시지 | `0008460` |
| C | P3-13/20/21/57 (+workflow route) | unguarded `request.json()` → try/catch 400 | `0008460` |
| C(부분) | P2-9/10/43/44/28, P3-65/75 | 삼켜 가짜 빈 결과로 렌더되던 쿼리 error → destructure+console.error(사용자 에러 UI 이연) | `0008460` |
| C | P3-19 | admin reviews rating Number.isInteger 경계검증 | `0008460` |
| B 금전정합 | P3-84 + 코드 P3-85 | refund: payment_key null이면 **409 거부**(Toss 취소 없는 가짜 refunded 차단) + 금액 `Number.isSafeInteger` 경계검증. red-green 라우트 테스트 | `c54a938` |
| B | P2-58 | approveDealOp/confirmDealOp UPDATE에 기대상태 CAS(`.eq('status',…)`) + 0행=실패. red-green 테스트 | `c54a938` |
| B | P2-8 (+P2-9 코드측) | matching insert 에러검사 + request 전이 CAS(open일 때만) + 실패 시 matching **보상 삭제**(고아 행 방지). UNIQUE 백스톱은 마이그 대기 | `c54a938` |
| B(부분) | P2-11 | recalcActivityPoints: select/update 에러 시 `{error}` 반환·**미기록**(실패 read 합산 0으로 덮어쓰기 금지), 라우트는 ok+warning(재시도=중복 유도 방지). insert+recalc 원자성·멱등키는 마이그/RPC 잔여 | `c54a938` |
| §2 (부분) | P3-34·72 | 콜백: email 없는 OAuth 계정 insert 전 가드 → 구분된 `error=email_required`+로그(매 로그인 opaque 실패 반복 제거). **완전 해소는 결정 필요**: Kakao 이메일 동의 필수화(콘솔 설정) 또는 email nullable 마이그 | `48bb494` |

| A 마감 | P2-15 | 파트너 published 편집 저장 시 **published→draft 재검수 회귀**(기존 enum 재사용, 마이그 불요) + 읽은 상태 CAS conflict + 저장 전 안내. 소유권 조회 PGRST116만 not_found | `c096f76` |
| E 공용모듈 | P2-14·P3-73/74/69 | ORDER_STATUS_LABELS·GRADE_LABEL 단일소스화, proxy 3앱 사본→createProxy() 팩토리(래퍼 pinning 테스트), expert 해석 6곳→resolveExpertFromAuth. 신규 테스트 14건 | `29fcbb8` |
| D2 a11y | UX P2-25/29/38/39×2/43, P3-10/49 | 미라벨 textarea 5건 aria-label(기존 카피 차용) + 에러 표시 7곳 role="alert"(기존 정답 패턴 준용). 속성 추가만, 시각 델타 0. P3-50(칩그룹 fieldset)은 D3 이월 | `e604c49` |

| E 잔여 | P2-40·P2-46(UX T17)·P3-41/79/101 | 카테고리 트리 2곳→CATEGORY_TREE(seed 대조 pinning), URL 폴백 13사이트→앱별 lib/urls.ts, 배지 색 15곳→status-badges.ts(색 변경 0, 의도적 드리프트는 로컬 오버라이드+주석), 점수계산 2경로→computeExpertScoreFields | `66ccf0b` |
| D3 a11y | UX P2-4/24/37, P3-13/29/50/67/75 | FilterRadioGroup 프리미티브(APG radio·로빙 탭인덱스·selectOnArrow, 11소비처) + admin 탭바 인라인 APG tabs + 아코디언 aria-expanded + 칩그룹 fieldset/legend. 로빙 로직 순수함수 테스트 9건. "토글" 지적분은 실제론 아코디언/필터 — 스위치 부재 확인 | `cebd4f2` |
| F 신뢰성 | P2-1/5/63, P3-16/22/60/81/103/111 + UX P1-1 | cancelPayment never-throw 계약화(red-green)·Toss 30s·adminClient 15s bounded fetch·결제버튼 35s, stale-response 시퀀스 토큰 2탭, 언바운드 쿼리 필터/limit, assign 버튼 in-flight. **정정**: Toss fetch 타임아웃은 기존재(P3-X의 실 갭은 계약·adminClient·클라이언트) | `8c62aba` |

> 실행 방식: 정직 스윕은 **앱별 분리 병렬 에이전트 3개**(파일 무겹침)로 처리하고 독립 검증(tsc·eslint·
> 테스트) 후 커밋. 마이그·토큰은 의사환경 정책동작·대비비 계산으로 검증. Batch B 코드전용분은
> red-green(가드 stash→10 fail→복원→48 pass)·tsc 0(3앱)·eslint 0으로 검증.
> E·D2·P2-15와 D3·E잔여·F는 각각 **파일 무겹침 병렬 에이전트 3개** 라운드로 실행 후 통합 fresh
> 게이트(라운드2 기준 vitest 114/114 · tsc 0(admin/owner/expert/shared/ui) · eslint 0)로 재검증하고
> 배치별 커밋. 에이전트 이연 교차분(배지 3파일·URL 2파일)은 통합 시점에 직접 마감.
>
> F 라운드에서 설계 필요로 이관: P2-4·P2-62(SQL 집계 RPC), P3-35(후보 조회 조인),
> P3-70/42/47(페이지네이션 UX 결정). 환경 메모: vitest는 소문자 드라이브 경로(Git Bash `c:/`)에서
> runner 탐색 실패 — PowerShell(대문자 `C:/`)에서 실행할 것.

라운드3 (파일 무겹침 병렬 3에이전트, 통합 게이트 vitest 134/134 · tsc 0×5 · eslint 0):

| 배치 | 감사 항목 | 조치 | 커밋 |
|---|---|---|---|
| F 잔여 | P2-18/52, P2-6, UX P2-51, P3-40/43/118 | createProxy 세션쿠키 동기화(공식 패턴, red-green — 간헐 로그아웃 해소, 3앱 동시), useSeededState 훅으로 stale-prop 5사이트(SearchBox 입력 중 리셋 없음), interest revalidatePath 근본 보정 | `5bf4ea5` |
| C 이연 마감 | P2-21/36/43/44, UX P2-6/9/10/28/31/34/35, P3-75 | ErrorState 공용 컴포넌트(20여 사이트) — 실패 섹션만 에러 상태, 검색 0건/조회 실패 카피 구분, PGRST116/인프라 실패 구분, 요약 카드 가짜 0→'—', admin 통계 API fail-loud 500(에러주입 red-green). **V1(랜딩 통계 가짜 0)은 디자인 결정 보류** | `d8c6a41` |
| D4 조작성 | UX P2-17/45/49, P3-81, V4 | 스플래시 dialog+포커스트랩+Esc, 드롭다운 Esc+포커스 복귀, TextRotator pause+reduced-motion(소비처 0 데드코드 확인 — 삭제 결정 잔여), 터치 타깃 24px 22곳. 캐러셀 부재·모달 1곳뿐 판정 | `5c9fdef` |

## 2. 감사 자체의 오류 (점검으로 발견)

- **코드 P1-3의 `UNIQUE(matching.request_id)` 권고는 틀림.** 한 request에 **복수 expert 제안이
  정상 설계**(AI 후보 여럿 중 택1 — 시드에서 request당 2건, 서로 다른 expert 확인). `UNIQUE(request_id)`는
  정상 흐름을 깨뜨린다. 올바른 백스톱은 **`UNIQUE(request_id, expert_id)`**(같은 expert 중복 제안만 차단).
  의사환경 검증: 시드 (request,expert) 중복 0, 적용 정상.
- 이에 따라 P1-3의 **코드 reorder도 재검토 대상**: `(request_id,expert_id)` 유니크가 있으면 admin
  더블클릭(같은 expert)은 DB가 차단하고, request 상태 전이는 멱등이므로 코드 CAS reorder가 불필요할 수 있다.

## 3. 미처리 — 적용 준비 완료 (프로드 중복 점검 후 배포)

UNIQUE 인덱스는 프로드에 기존 중복이 있으면 적용 실패한다. **먼저 점검 쿼리를 프로드에서 실행**하고
0건이면 배포한다.

```sql
-- P1-3 점검
SELECT request_id, expert_id, count(*) FROM matching
 GROUP BY request_id, expert_id HAVING count(*) > 1;
-- P1-10 점검
SELECT deal_id, author_type, count(*) FROM review
 GROUP BY deal_id, author_type HAVING count(*) > 1;
```
점검 0건 시 적용(의사환경 검증 완료):
```sql
CREATE UNIQUE INDEX uq_matching_request_expert ON matching(request_id, expert_id);   -- P1-3 backstop
DROP INDEX IF EXISTS idx_review_deal_author;
CREATE UNIQUE INDEX uq_review_deal_author ON review(deal_id, author_type);            -- P1-10 backstop
```

## 4. 미처리 — 설계 필요 (기계적 실행 불가)

| 항목 | 점검으로 확정된 사실 | 필요 작업 |
|---|---|---|
| 코드 P1-9 refund 로스트 업데이트 | Toss 취소가 DB update **앞** → 단순 CAS는 "Toss는 취소됐는데 DB 미기록"의 더 나쁜 불일치 유발 | Toss **전** 원자적 예약(조건부 UPDATE)→Toss→실패 시 롤백으로 결제 순서 재설계 |
| 코드 P1-17 정산 원자성 | steps 4~8 비트랜잭션, 원장 적립 실패 swallow → 원장 드리프트 | release+원장 적립을 단일 Postgres RPC(트랜잭션)로 이전 |
| 코드 P1-5 신규자 게이트(잔여) | 원본 데드 라우트가 존재않는 `deal_workflow.queue_status`에 write·소비처 없음. admin에 신규자 결과물 **검수 완료 UI 부재** 확인 | 검수 큐(컬럼/상태) + 관리자 검수·완료 화면 **기능 신설** |

## 5. 미실시 검증 (정직 기록)

- **브라우저 런타임 E2E**: 로컬 Supabase 스택이 config.toml 버전 드리프트로 기동 불가 + 프로드는
  실험 금지 → tsc·lint·vitest·마이그레이션 레벨만 검증. 실제 렌더/런타임 동작은 미확인.
- **동시성 CAS의 실제 병렬 레이스**: 로직·타입·의사환경 스키마로 확인, 실부하 병렬 테스트는 미실시.
- **마이그레이션의 프로드 적용**: 의사환경(fresh)에서만 검증. 0019는 파괴적 리셋을 포함하므로 프로드
  직접 적용 금지 — 스테이징 선행 필수(라이브는 이미 수동 반영됨).
