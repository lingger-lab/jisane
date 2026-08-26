import { describe, it, expect } from 'vitest'
import {
  anonymizedEmail,
  ownerWithdrawalPayload,
  expertWithdrawalPayload,
  providerWithdrawalPayload,
} from './withdrawal'

const AT = '2026-08-27T00:00:00.000Z'

describe('anonymizedEmail', () => {
  it('row id를 결합해 유일한 익명 이메일을 만든다', () => {
    expect(anonymizedEmail('abc-123')).toBe('withdrawn+abc-123@deleted.local')
  })
})

describe('ownerWithdrawalPayload', () => {
  const p = ownerWithdrawalPayload('o1', 'self', AT)
  it('status/withdrawn 메타를 설정한다', () => {
    expect(p.status).toBe('withdrawn')
    expect(p.withdrawn_at).toBe(AT)
    expect(p.withdrawn_by).toBe('self')
  })
  it('개인식별정보를 익명화한다', () => {
    expect(p.email).toBe('withdrawn+o1@deleted.local')
    expect(p.company).toBe('(탈퇴회원)')
    expect(p.ceo_name).toBeNull()
    expect(p.region).toBeNull()
    expect(p.industry).toBeNull()
    expect(p.contact).toBeNull()
  })
})

describe('expertWithdrawalPayload', () => {
  const p = expertWithdrawalPayload('e1', 'admin', AT)
  it('실명은 제거하고 활동명은 익명화한다', () => {
    expect(p.status).toBe('withdrawn')
    expect(p.withdrawn_by).toBe('admin')
    expect(p.email).toBe('withdrawn+e1@deleted.local')
    expect(p.name).toBe('(탈퇴회원)')
    expect(p.real_name).toBeNull()
    expect(p.contact).toBeNull()
  })
})

describe('providerWithdrawalPayload', () => {
  const p = providerWithdrawalPayload('p1', 'self', AT)
  it('email은 null(선택 컬럼), 기관명·설명·웹사이트를 비운다', () => {
    expect(p.status).toBe('withdrawn')
    expect(p.email).toBeNull()
    expect(p.name).toBe('(탈퇴회원)')
    expect(p.website).toBeNull()
    expect(p.description).toBeNull()
    expect(p.contact).toBeNull()
  })
})
