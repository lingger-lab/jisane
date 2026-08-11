import { createProxy } from '@jisane/shared/proxy'

// Supabase 세션 갱신 — 구현은 공용 팩토리 단일 소스 (감사 docs/11 P3-74).
export const proxy = createProxy()

// matcher는 빌드 시 정적 분석 대상이라 리터럴로 유지 (동적 값은 무시됨).
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
