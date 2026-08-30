/**
 * 상담문의 접수 — 순수 검증 로직(서버/클라 공용, 테스트 대상).
 * 부수효과(DB·통지)는 create.ts(server-only)에 분리한다.
 */

/** 개인정보처리방침 버전 — 동의 스냅샷·원장에 함께 기록. 방침 개정 시 갱신. */
export const CONSENT_VERSION = '2026-09-01'

/**
 * 휴대폰 정규화 — 숫자만 추출 후 국내 휴대폰(01X, 10~11자리) 검증.
 * 유효하면 숫자열 반환, 아니면 null. 발송 키로 쓰이므로 저장은 정규화값으로 통일.
 */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null
  const digits = raw.replace(/\D/g, '')
  if (!/^01\d{8,9}$/.test(digits)) return null
  return digits
}

/** 이름 검증 — 1~40자(공백 trim 후). */
export function isValidName(raw: string | null | undefined): boolean {
  const s = (raw ?? '').trim()
  return s.length >= 1 && s.length <= 40
}

export interface InquiryFormInput {
  name: string | null
  phone: string | null
  detail: string | null
  privacyConsent: boolean
  marketingConsent: boolean
  /** 봇 트랩(허니팟) — 정상 사용자는 비워둠. 채워져 있으면 스팸. */
  honeypot: string | null
}

export type InquiryValidation =
  | { ok: true; value: { name: string; phone: string; detail: string | null; marketingConsent: boolean } }
  | { ok: false; error: string; spam?: boolean }

/**
 * 접수 폼 검증. 순서: 허니팟(스팸) → 이름 → 휴대폰 → 필수동의.
 * 허니팟에 걸리면 spam=true로 표시(호출부는 봇에 힌트를 주지 않기 위해 성공한 척 처리).
 */
export function validateInquiry(input: InquiryFormInput): InquiryValidation {
  if (input.honeypot && input.honeypot.trim() !== '') {
    return { ok: false, error: '', spam: true }
  }
  if (!isValidName(input.name)) {
    return { ok: false, error: '이름을 입력해주세요.' }
  }
  const phone = normalizePhone(input.phone)
  if (!phone) {
    return { ok: false, error: '올바른 휴대폰 번호를 입력해주세요.' }
  }
  if (!input.privacyConsent) {
    return { ok: false, error: '개인정보 수집·이용에 동의해주세요.' }
  }
  const detail = (input.detail ?? '').trim() || null
  return {
    ok: true,
    value: { name: (input.name ?? '').trim(), phone, detail, marketingConsent: input.marketingConsent },
  }
}
