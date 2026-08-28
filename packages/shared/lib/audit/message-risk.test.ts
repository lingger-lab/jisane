import { describe, it, expect } from 'vitest'
import { scanMessageRisk } from './message-risk'

describe('scanMessageRisk — 양성(위험 감지)', () => {
  it('휴대폰 번호(구분자 유무)', () => {
    expect(scanMessageRisk('010-1234-5678로 연락주세요')).toContain('phone')
    expect(scanMessageRisk('01012345678')).toContain('phone')
    expect(scanMessageRisk('010.1234.5678')).toContain('phone')
  })
  it('계좌', () => {
    expect(scanMessageRisk('국민은행 123-456-789012 입니다')).toContain('bank_account')
    expect(scanMessageRisk('계좌번호 알려드릴게요')).toContain('bank_account')
    expect(scanMessageRisk('입금은 계좌 이체로')).toContain('bank_account')
  })
  it('외부 메신저', () => {
    expect(scanMessageRisk('카톡 아이디 abc123')).toContain('messenger')
    expect(scanMessageRisk('open.kakao.com/o/xyz')).toContain('messenger')
    expect(scanMessageRisk('텔레그램으로 연락드릴게요')).toContain('messenger')
    expect(scanMessageRisk('라인 아이디 hello')).toContain('messenger')
  })
  it('이메일', () => {
    expect(scanMessageRisk('me@gmail.com 으로 보내주세요')).toContain('email')
  })
  it('직거래 유도', () => {
    expect(scanMessageRisk('직거래로 진행하시죠')).toContain('direct_deal')
    expect(scanMessageRisk('수수료 빼고 현금으로 드릴게요')).toContain('direct_deal')
    expect(scanMessageRisk('따로 연락드리겠습니다')).toContain('direct_deal')
  })
  it('복합 문장 → 다중 사유', () => {
    const r = scanMessageRisk('직거래로 010-1234-5678 카톡 주세요')
    expect(r).toEqual(expect.arrayContaining(['direct_deal', 'phone', 'messenger']))
    // 중복 없음
    expect(new Set(r).size).toBe(r.length)
  })
})

describe('scanMessageRisk — 음성(오탐 없음)', () => {
  it('일반 업무 문장', () => {
    expect(scanMessageRisk('견적서 전달드립니다. 확인 부탁드려요.')).toEqual([])
    expect(scanMessageRisk('10월 10일까지 완료하겠습니다')).toEqual([])
    expect(scanMessageRisk('제품 라인업을 검토했습니다')).toEqual([])
    expect(scanMessageRisk('공정 라인 점검이 필요합니다')).toEqual([])
  })
  it('빈 문자열', () => {
    expect(scanMessageRisk('')).toEqual([])
  })
})
