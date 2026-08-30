import { describe, it, expect } from 'vitest'
import { normalizePhone, isValidName, validateInquiry, type InquiryFormInput } from './validate'

describe('normalizePhone', () => {
  it('하이픈·공백 제거 후 숫자열 반환', () => {
    expect(normalizePhone('010-1234-5678')).toBe('01012345678')
    expect(normalizePhone(' 010 1234 5678 ')).toBe('01012345678')
  })
  it('10자리(011 등)도 허용', () => {
    expect(normalizePhone('011-123-4567')).toBe('0111234567')
  })
  it('유효하지 않으면 null', () => {
    expect(normalizePhone('02-123-4567')).toBeNull() // 지역번호
    expect(normalizePhone('123')).toBeNull()
    expect(normalizePhone('010-1234-56')).toBeNull() // 9자리 미달
    expect(normalizePhone('010-1234-56789')).toBeNull() // 12자리 초과
    expect(normalizePhone('')).toBeNull()
    expect(normalizePhone(null)).toBeNull()
  })
})

describe('isValidName', () => {
  it('1~40자 허용, 공백 trim', () => {
    expect(isValidName('홍길동')).toBe(true)
    expect(isValidName('  김  ')).toBe(true)
  })
  it('빈값/40자 초과 거부', () => {
    expect(isValidName('')).toBe(false)
    expect(isValidName('   ')).toBe(false)
    expect(isValidName('가'.repeat(41))).toBe(false)
    expect(isValidName(null)).toBe(false)
  })
})

describe('validateInquiry', () => {
  const base: InquiryFormInput = {
    name: '홍길동', phone: '010-1234-5678', detail: '문의합니다',
    privacyConsent: true, marketingConsent: false, honeypot: null,
  }

  it('정상 입력 → ok + 정규화값', () => {
    const r = validateInquiry(base)
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value).toEqual({ name: '홍길동', phone: '01012345678', detail: '문의합니다', marketingConsent: false })
    }
  })

  it('허니팟 채워지면 spam=true (에러 노출 안 함)', () => {
    const r = validateInquiry({ ...base, honeypot: 'bot' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.spam).toBe(true)
  })

  it('이름 없으면 거부', () => {
    const r = validateInquiry({ ...base, name: '' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('이름')
  })

  it('휴대폰 무효면 거부', () => {
    const r = validateInquiry({ ...base, phone: '02-123-4567' })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('휴대폰')
  })

  it('필수 동의 미체크면 거부', () => {
    const r = validateInquiry({ ...base, privacyConsent: false })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain('개인정보')
  })

  it('빈 detail은 null로 정규화', () => {
    const r = validateInquiry({ ...base, detail: '   ' })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.detail).toBeNull()
  })

  it('마케팅 동의 반영', () => {
    const r = validateInquiry({ ...base, marketingConsent: true })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.marketingConsent).toBe(true)
  })
})
