import { describe, it, expect } from 'vitest'
import { composeAdMessage, isAdSendBlockedHour, smsByteLength, AD_PREFIX } from './compose'
import { signUnsubscribeToken, parseUnsubscribeToken } from './token'

describe('composeAdMessage', () => {
  it('(광고) 접두 + 수신거부 말미 자동 삽입 (friendtalk)', () => {
    const m = composeAdMessage('이번 달 혜택 안내', 'friendtalk', '채널 차단')
    expect(m.startsWith(`${AD_PREFIX} `)).toBe(true)
    expect(m).toContain('이번 달 혜택 안내')
    expect(m).toContain('무료수신거부: 채널 차단')
  })
  it('lms는 번호형 수신거부', () => {
    const m = composeAdMessage('공지', 'lms', '080-000-0000')
    expect(m).toContain('(광고) 공지')
    expect(m).toContain('무료수신거부 080-000-0000')
  })
  it('본문 앞뒤 공백 trim', () => {
    expect(composeAdMessage('  x  ', 'friendtalk', 'y')).toContain('(광고) x\n')
  })
})

describe('isAdSendBlockedHour', () => {
  it('21~08시(21,22,23,0,7) 차단', () => {
    for (const h of [21, 22, 23, 0, 5, 7]) expect(isAdSendBlockedHour(h)).toBe(true)
  })
  it('08~20시 허용', () => {
    for (const h of [8, 9, 12, 20]) expect(isAdSendBlockedHour(h)).toBe(false)
  })
})

describe('smsByteLength', () => {
  it('한글 2바이트·영문 1바이트', () => {
    expect(smsByteLength('abc')).toBe(3)
    expect(smsByteLength('가나')).toBe(4)
    expect(smsByteLength('a가')).toBe(3)
  })
})

describe('unsubscribe token', () => {
  const secret = 'test-secret-xyz'
  it('서명·검증 왕복', () => {
    const t = signUnsubscribeToken('01012345678', secret)
    expect(parseUnsubscribeToken(t, secret)).toBe('01012345678')
  })
  it('다른 secret이면 거부', () => {
    const t = signUnsubscribeToken('01012345678', secret)
    expect(parseUnsubscribeToken(t, 'other')).toBeNull()
  })
  it('변조 토큰 거부', () => {
    const t = signUnsubscribeToken('01012345678', secret)
    const tampered = t.slice(0, -2) + 'xx'
    expect(parseUnsubscribeToken(tampered, secret)).toBeNull()
  })
  it('형식 오류 null', () => {
    expect(parseUnsubscribeToken('garbage', secret)).toBeNull()
    expect(parseUnsubscribeToken('', secret)).toBeNull()
  })
})
