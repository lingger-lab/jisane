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
