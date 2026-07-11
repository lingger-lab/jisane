# 지사네 MVP 스모크 테스트 체크리스트

> 베타 테스트 참여자용 — 2026.07.11 기준
>
> **테스트 환경**
> - Admin: https://jisane.cloud
> - Owner(기업): https://owner.jisane.cloud
> - Partner(시니어): https://partner.jisane.cloud

---

## A. 사전 준비

- [ ] 테스트용 Google 또는 카카오 계정 2개 준비 (기업용 1개, 시니어용 1개)
- [ ] 관리자 계정 확인 (ADMIN_EMAILS에 등록된 이메일)
- [ ] 모바일 기기 1대 (반응형 테스트)
- [ ] 크롬 / 사파리 브라우저

---

## 1. 인증 흐름 (3개 앱 공통)

### Admin (jisane.cloud)
- [ ] 홈페이지 정상 로딩 (부울경 로컬 인력매칭 소개)
- [ ] 로그인 버튼 클릭 → 드롭다운 표시 (카카오 / Google)
- [ ] 카카오 로그인 → 관리자 이메일이면 /dashboard 도착
- [ ] Google 로그인 → 관리자 이메일이면 /dashboard 도착
- [ ] 관리자 아닌 이메일로 로그인 → `/` 홈으로 리다이렉트
- [ ] 로그아웃 → 홈 화면 복귀
- [ ] 로그아웃 상태에서 /dashboard 직접 접근 → 홈으로 리다이렉트

### Owner (owner.jisane.cloud)
- [ ] 홈페이지 정상 로딩 (기업공간 랜딩)
- [ ] 카카오 / Google 로그인 → /request 페이지 도착
- [ ] 첫 로그인 시 client 레코드 자동 생성 확인
- [ ] 로그아웃 → 홈 화면 복귀

### Partner (partner.jisane.cloud)
- [ ] 홈페이지 정상 로딩 (시니어공간 랜딩)
- [ ] 카카오 / Google 로그인 → 첫 방문이면 /register, 기존이면 /matching
- [ ] 첫 로그인 시 partner 레코드 자동 생성 확인
- [ ] 로그아웃 → 홈 화면 복귀

### 세션 유지
- [ ] 로그인 후 브라우저 새로고침 → 로그인 상태 유지
- [ ] 10분 이상 경과 후 새로고침 → 세션 유지 (미들웨어 프록시 동작)

---

## 2. 기업(Owner) 의뢰 등록

- [ ] /request 페이지 접근
- [ ] 분야 선택 (7대 카테고리 중 택 1)
- [ ] 의뢰 제목 입력 (필수, 최대 200자)
- [ ] 상세 내용 입력 (필수, 최대 5,000자)
- [ ] 희망 예산 입력 (선택, 1만원 단위)
- [ ] 필수값 비어 있을 때 → 에러 메시지 표시
- [ ] 등록 버튼 클릭 → "의뢰가 등록되었습니다" 토스트
- [ ] /status 목록에서 방금 등록한 의뢰 확인 (상태: 접수)
- [ ] /status/[id] 상세 페이지 정상 표시

---

## 3. 시니어(Partner) 프로필 등록

- [ ] /register 페이지 접근
- [ ] 이름 입력 (필수)
- [ ] 전문 분야 선택 (최대 5개)
- [ ] 경력 연수 선택
- [ ] 연락처 입력
- [ ] 0% 수수료 안내 배너 표시 확인
- [ ] 저장 → /matching 페이지로 이동
- [ ] /mypage에서 등록한 정보 표시 확인

---

## 4. 관리자 매칭 프로세스

### 4-1. 매칭 대기 탭
- [ ] Admin /dashboard 접속
- [ ] 요약 카드 7개 정상 표시 (매칭 대기 / 매칭 진행 / 진행 중 / 정산 대기 / 서비스 주문 / 문의 / 적립금 잔액)
- [ ] "매칭 대기" 탭 → 등록된 의뢰 표시
- [ ] 의뢰 카드: 제목 / 분야 / 예산 / 기업 정보 / 연락처 표시
- [ ] "후보 보기" 클릭 → 추천 후보 목록 펼침
- [ ] "AI 후보 추천" 클릭 → AI 분석 후 순위별 후보 표시
- [ ] 후보 선택 → "이 후보로 매칭" 클릭
- [ ] 성공 메시지: "매칭이 생성되었습니다" + 의뢰 카드 사라짐

### 4-2. 매칭 진행 탭
- [ ] "매칭 진행" 탭 클릭 → 방금 생성한 매칭 표시
- [ ] 파트너 이름 / 분야 / 연락처 정상 표시
- [ ] "응답 대기" 뱃지 + 경과 시간 표시

---

## 5. 시니어(Partner) 매칭 수락

- [ ] Partner /matching 접속
- [ ] "새 매칭 제안" 카운트 증가 확인
- [ ] 매칭 카드 클릭 → /matching/[id] 상세
- [ ] 의뢰 제목 / 카테고리 / 예산 / 상세 내용 표시
- [ ] "수락" 버튼 클릭 → deal 생성
- [ ] /work 목록에 새 작업 표시

---

## 6. 거래 진행 (워크플로우)

### Owner 측
- [ ] /status/[id] → 매칭된 파트너 정보 표시
- [ ] 견적 정보 표시 (작업비 / 매칭피)
- [ ] "견적 승인" 버튼 클릭 → deal 상태 working으로 전환

### Partner 측
- [ ] /work/[id] → 작업 상세 페이지
- [ ] 워크플로우 체크리스트 5단계 표시:
  1. [ ] 접수 (intake)
  2. [ ] 구조화 (structure)
  3. [ ] 작업 (generate)
  4. [ ] 검증 (verify)
  5. [ ] 납품 (deliver)
- [ ] 각 단계: pending → in_progress → done 전환
- [ ] 단계별 메모 입력 (선택)
- [ ] 전환 시 타임스탬프 기록 확인

### 메시지 송수신
- [ ] Owner → 메시지 입력 → 전송
- [ ] Partner 측에서 해당 메시지 확인
- [ ] Partner → 답장 → Owner 측에서 확인
- [ ] 메시지 발신자 라벨 (기업 / 시니어 / 매니저) 정상 표시
- [ ] Admin → 대시보드 "진행 중" 탭에서 메시지 카운트 뱃지 표시

### 작업 완료
- [ ] Partner → 5단계 모두 done → "작업 완료" 가능
- [ ] Owner → 검수 확인 → deal 상태 done

---

## 7. 결제 · 정산

### 결제 (Owner)
- [ ] 견적 승인 시 결제 버튼 표시
- [ ] 결제 클릭 → Toss Payments 결제창 진입
- [ ] 테스트 카드 결제 완료 → 리다이렉트 복귀
- [ ] settlement.escrow_status = "deposited" 확인

### 정산 (Admin)
- [ ] Admin "정산 관리" 탭 → 에스크로 입금 건 표시
- [ ] 작업비 / 매칭피 / 적립금 금액 표시
- [ ] "정산 실행" 클릭 → 확인 다이얼로그
- [ ] 정산 후: escrow_status = "released"
- [ ] 적립금 원장에 accrue 기록 추가 확인
- [ ] 적립금 잔액 카드 업데이트 확인

---

## 8. 리뷰 작성

- [ ] Owner → 완료된 거래 상세 → 리뷰 섹션 표시
- [ ] 별점 선택 (1~5)
- [ ] 코멘트 입력
- [ ] 제출 → 리뷰 저장 확인
- [ ] Admin → /review-input/[dealId] → 관리자 리뷰 입력
- [ ] AI 추천 리뷰 표시 (있는 경우)

---

## 9. 서비스 주문

### Owner 측
- [ ] /services 페이지 → 서비스 패키지 목록 표시
- [ ] 패키지 상세 → 가격 / 기간 / 제공 내용 확인
- [ ] "신청" 클릭 → service_order 생성
- [ ] /status 하단에 서비스 주문 현황 표시

### Partner 측
- [ ] /education → AI 역량강화 프로그램 목록
- [ ] 프로그램 상세 → 신청 클릭

### Admin 측
- [ ] "서비스 주문" 탭 → 주문 목록 표시
- [ ] 카테고리 필터 (전체 / AX 컨설팅 / 경영 컨설팅 / 교육)
- [ ] 상태 변경 드롭다운 (접수 → 결제 완료 → 진행 중 → 완료)
- [ ] 상태 변경 실패 시 에러 메시지 표시

---

## 10. 문의 · 챗봇

- [ ] 각 앱 우측 하단 챗봇 위젯 표시
- [ ] 챗봇 힌트 말풍선 자동 표시 (2.5초 후) → 자동 소멸 (8초 후)
- [ ] 챗봇에 질문 입력 → AI 응답
- [ ] "사람 연결" 에스컬레이션 → inquiry 레코드 생성
- [ ] Admin "문의" 탭에서 에스컬레이션된 문의 확인
- [ ] "종료" 버튼으로 문의 닫기

---

## 11. 퍼블릭 페이지 (Admin 앱)

- [ ] /service → 서비스 안내 6단계 프로세스
- [ ] /ax → AX 전환 소개
- [ ] /ax-process → AX 프로세스 상세
- [ ] /standard/scope → 용역 표준 범위
- [ ] /standard/guarantee → 적립금 규정
- [ ] /privacy → 개인정보처리방침
- [ ] /docs/quote/[dealId] → 견적서 (인쇄 레이아웃)
- [ ] /docs/statement/[dealId] → 명세서 (인쇄 레이아웃)

---

## 12. UI/UX 체크

### 반응형
- [ ] 모바일(375px): 요약 카드 2열, 탭 수평 스크롤
- [ ] 태블릿(768px): 요약 카드 4열
- [ ] 데스크톱(1280px): 요약 카드 7열 한 줄

### 네비게이션
- [ ] 로고 클릭 → 홈 화면 이동 (3개 앱 모두)
- [ ] 로그인/로그아웃 버튼 정상 동작

### 에러 상태
- [ ] 잘못된 URL → 404 페이지 표시
- [ ] ?error=unauthorized → 빨간 에러 토스트 → 자동 소멸
- [ ] 네트워크 끊김 상태에서 액션 시도 → 에러 메시지 표시

### 접근성
- [ ] 키보드 Tab 이동 → 주요 버튼/입력 필드 포커스 순환
- [ ] 로그인 드롭다운 키보드 조작 가능

---

## 13. 크로스 링크

- [ ] Admin 홈 → Owner 랜딩 (기업 바로가기)
- [ ] Admin 홈 → Partner 랜딩 (시니어 바로가기)
- [ ] Owner 헤더 로고 → Admin 홈 (jisane.cloud)
- [ ] Partner 헤더 로고 → Admin 홈 (jisane.cloud)

---

## 실행 방법

### 로컬 테스트
```bash
npm run dev
# Admin: localhost:3000
# Owner: localhost:3001
# Partner: localhost:3002
```

### 프로덕션 테스트
배포 직후 아래 URL에서 확인:
- https://jisane.cloud
- https://owner.jisane.cloud
- https://partner.jisane.cloud

---

## 이슈 리포트 방법

1. 실패한 항목의 **번호** 기록 (예: "7-3 정산 실행 실패")
2. **스크린샷** 또는 **화면 녹화** 첨부
3. **브라우저 / 기기** 정보 기재
4. GitHub Issue 생성: https://github.com/lingger-lab/jisane/issues
   - 라벨: `bug`, `smoke-test-failure`

---

## 상태 전이 요약 (참고용)

```
의뢰:    open → matching → dealt → closed
매칭:    proposed → accepted / rejected
거래:    quoted → working → done
워크플로: pending → in_progress → done (5단계)
에스크로: (없음) → deposited → reviewing → released
서비스:  pending → paid → processing → completed / cancelled
문의:    open → human_routed → closed
```
