/**
 * 크로스 앱 URL 단일 소스 (감사 docs/11 P3-17 — 산재하던 `env || 리터럴` 폴백 통합).
 * env 미설정 시 프로덕션 URL로 폴백하는 것은 의도된 동작(문서화된 deliberate fallback) —
 * preview/staging 빌드는 반드시 NEXT_PUBLIC_*_URL을 설정할 것(미설정 시 프로드로 연결됨).
 * NEXT_PUBLIC_* 은 빌드 타임에 인라인되므로 `process.env.NEXT_PUBLIC_X` 리터럴 형태를 유지한다.
 */
export const OWNER_URL = process.env.NEXT_PUBLIC_OWNER_URL || 'https://owner.jisane.cloud'
export const EXPERT_URL = process.env.NEXT_PUBLIC_EXPERT_URL || 'https://expert.jisane.cloud'
