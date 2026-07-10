# Docent RAG 챗봇 연동 — 작업 인수인계

**작업일:** 2026-07-10
**요약:** 지사네 자체 FAQ 챗봇 위젯(`/api/chat` 기반)을 **외부 Docent RAG 챗봇 위젯**(임베드 스크립트)으로 **교체**했다. 3개 앱(admin·owner·partner) 전부 적용. 구 FAQ 백엔드는 고아가 되어 제거했다.

---

## 1. 무엇을·왜 바꿨나
- **기존:** `@jisane/ui`의 `ChatWidgetLazy` → `/api/chat`(FAQ 규칙 매칭 + 에스컬레이션) 호출하는 **자체 정적 FAQ 봇**. role별(admin/owner/partner) quickQuestions 제공.
- **변경:** 세 앱 레이아웃에서 위 위젯을 **Docent 공개봇 임베드 스크립트**로 교체. Docent = 지식(문서/사이트)을 학습하는 **RAG 챗봇**이라, 정적 FAQ보다 답변 범위가 넓고 대시보드에서 노코드로 운영 가능.
- **봇 운영 주체는 1개 봇으로 통일**(3앱 공통). 공간별(기업/시니어) 맞춤이 크게 필요해지면 그때 봇을 분리한다(현재는 과분한 유지비라 보류).

## 2. Docent 봇 정보
- **botId:** `bc714dfa-4cc5-474a-aa14-e0c0493b4a0c` (공개봇)
- **임베드 호스트:** `https://ragbot-web-n6qj3b5f3q-du.a.run.app`
- **운영 대시보드:** 위 호스트 `/dashboard` (구글 로그인: **algorithm747@gmail.com**, jisane 전용 신규 계정/워크스페이스)
- **임베드 스니펫(모든 앱 공통):**
  ```html
  <script src="https://ragbot-web-n6qj3b5f3q-du.a.run.app/embed.js"
          data-bot="bc714dfa-4cc5-474a-aa14-e0c0493b4a0c" defer></script>
  ```
  Next.js에선 `next/script`로 삽입:
  ```tsx
  import Script from "next/script";
  <Script src="https://ragbot-web-n6qj3b5f3q-du.a.run.app/embed.js"
          data-bot="bc714dfa-4cc5-474a-aa14-e0c0493b4a0c"
          strategy="afterInteractive" />
  ```

## 3. 변경 파일
**수정(위젯 교체):**
- `apps/admin/app/layout.tsx` — `<ChatWidgetLazy role="admin">` → Docent `<Script>`
- `apps/owner/app/layout.tsx` — `<ChatWidgetLazy role="owner" …>` → Docent `<Script>`
- `apps/partner/app/layout.tsx` — `<ChatWidgetLazy role="partner" …>` → Docent `<Script>`
- `packages/ui/package.json` — `./chat-widget`, `./chat-widget-lazy` export 항목 제거

**삭제(위젯 교체로 고아가 된 구 FAQ 챗봇 일체):**
- `packages/ui/components/chat-widget.tsx`
- `packages/ui/components/chat-widget-lazy.tsx`
- `apps/admin/app/api/chat/route.ts` (FAQ 응답 API — 다른 곳에서 호출 없음)
- `apps/admin/lib/chat/faq-matcher.ts`
- `apps/admin/lib/chat/escalation.ts`
- `apps/admin/lib/chat/faq-data.ts` (하드코딩 FAQ 15개 — 내용은 Docent 지식으로 이관, 아래 4절)

> 삭제 근거: 위 모듈들은 서로만 참조하며, 위젯 제거 후 앱에서 참조 0(테스트도 없음). dangling import 없음 확인 완료.

## 4. 구 FAQ 콘텐츠 이관 (중요)
구 `faq-data.ts`의 FAQ 15개는 **Docent 봇 지식으로 이관**한다(대시보드 '지식' 탭 붙여넣기). 이관 문서는 마케팅 사이트가 아니라 **이 FAQ가 정답 기준**이다. 특히 **가격 정책**에 주의:

> ⚠️ 랜딩의 "수수료 0%"는 **시니어(작업자) 기준**이다. **매칭비는 기업 부담·작업료 규모별 차등**(3~10만 20% / 10~30만 15% / 30~50만 5만 정액 / 50~80만 7만 정액 / 80~300만 7% / 300만↑ 5%), **최소 작업비 3만원**. 에스크로=토스페이먼츠, 검수 3일(72h) 자동완료, 매칭=AI+전문가 최소 3명 평가, 지사네 책임 적립금(매칭비 10%).

## 5. 남은 작업 (Docent 대시보드에서)
1. **지식 채우기** — 위 이관 문서를 '지식' 탭에 붙여넣기. 보조로 사이트 자동학습을 seed 3개로:
   `https://jisane.cloud/` · `https://owner.jisane.cloud/` · `https://partner.jisane.cloud/`
   (크롤러 스코프는 origin 완전일치라 서브도메인은 seed를 따로 넣어야 포함됨. `(main)` 라우트는 로그인 벽이라 크롤 불가.)
2. **위젯 외형/인사말** — 대시보드 '위젯 화면'에서 색·인사말·추천질문 설정(구 위젯의 role별 quickQuestions는 이관되지 않으므로 필요 시 봇에서 재설정).
3. **동작 확인** — 로컬 dev/build로 위젯 1개(Docent)만 뜨는지 확인 후 배포.

## 6. 롤백
`git revert`(이 커밋)로 구 위젯·`/api/chat`·FAQ 전부 복원 가능. Docent 임베드는 스크립트 3줄이라 제거도 간단.
