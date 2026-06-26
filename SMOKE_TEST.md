# 스모크 테스트 체크리스트

배포 후 핵심 흐름 5개를 수동으로 확인합니다.

---

## 1. 인증 흐름

- [ ] **Owner 로그인**: owner.jisane.cloud → Google/카카오 로그인 → 의뢰 목록 페이지 도착
- [ ] **Partner 로그인**: partner.jisane.cloud → Google/카카오 로그인 → 매칭 홈 페이지 도착
- [ ] **Admin 로그인**: jisane.cloud → 로그인 → 대시보드 페이지 도착 (ADMIN_EMAILS에 포함된 계정만)
- [ ] **세션 유지**: 로그인 후 10분 뒤 새로고침 → 로그아웃되지 않음 (proxy.ts 동작 확인)
- [ ] **비인가 접근**: 로그아웃 상태에서 /dashboard 접근 → 로그인 페이지로 리다이렉트

## 2. 의뢰 → 매칭 흐름

- [ ] **의뢰 등록**: Owner → 새 의뢰 등록 → "의뢰가 등록되었습니다" 토스트 표시
- [ ] **의뢰 목록**: Owner → 의뢰 목록에서 방금 등록한 의뢰 확인 (상태: 접수)
- [ ] **Admin 매칭 대기**: Admin 대시보드 → 매칭 대기 탭에 새 의뢰 표시
- [ ] **Admin 매칭**: Admin → 후보 목록 → 파트너 선택 → 매칭 생성
- [ ] **Partner 매칭 수신**: Partner → 매칭 홈에서 새 매칭 제안 확인

## 3. 거래 진행 흐름

- [ ] **견적 승인**: Owner → 의뢰 상세 → 견적 승인 → 상태 변경 (quoted → working)
- [ ] **워크플로우 업데이트**: Partner → 작업 상세 → 워크플로우 단계 진행 (체크리스트 반영)
- [ ] **메시지 송수신**: Owner → 메시지 입력 → 전송 → Partner 측에서 확인
- [ ] **검수 완료**: Owner → 검수 확인 → 상태 변경 (working → done)

## 4. 결제 · 정산 흐름

- [ ] **결제 페이지**: Owner → 결제 → Toss 결제창 진입 (테스트 키 환경)
- [ ] **정산 대기**: Admin → 정산 대기 탭에 에스크로 입금 확인
- [ ] **정산 실행**: Admin → 에스크로 해제 → deal 상태 done + 적립금 원장 기록 확인

## 5. 부가 기능

- [ ] **서비스 주문**: Owner/Partner → 서비스 카탈로그 → 신청 → Admin 서비스 탭에 표시
- [ ] **문의 등록**: 챗봇 → 사람 연결 에스컬레이션 → Admin 문의 탭에 표시
- [ ] **리뷰 작성**: Owner → 완료된 거래 → 별점 + 코멘트 제출
- [ ] **에러 토스트**: 잘못된 URL 파라미터 (?error=unauthorized) → 빨간 토스트 표시 후 자동 소멸

---

## 실행 방법

1. **로컬**: `npm run dev` 후 localhost:3000 / 3001 / 3002에서 확인
2. **스테이징**: Vercel Preview URL에서 확인
3. **프로덕션**: 배포 직후 jisane.cloud / owner.jisane.cloud / partner.jisane.cloud에서 확인

## 실패 시

- 스크린샷 첨부하여 GitHub Issue 생성
- 라벨: `bug`, `smoke-test-failure`
