import { describe, it, expect } from 'vitest'
import {
  REQUEST_STATUS_BADGE_CLASSES,
  DEAL_STATUS_BADGE_CLASSES,
  MATCHING_STATUS_BADGE_CLASSES,
  ORDER_STATUS_BADGE_CLASSES,
  INVITATION_STATUS_BADGE_CLASSES,
  DISPUTE_STATUS_BADGE_CLASSES,
  PACKAGE_STATUS_BADGE_CLASSES,
  PROVIDER_STATUS_BADGE_CLASSES,
} from './status-badges'
import {
  REQUEST_STATUS_LABELS,
  DEAL_STATUS_LABELS,
  MATCHING_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  INVITATION_STATUS_LABELS,
  DISPUTE_STATUS_LABELS,
  PACKAGE_STATUS_LABELS,
  PROVIDER_STATUS_LABELS,
} from './labels'

// 배지 색 단일소스화(UX 감사 docs/10 P2-46 / T17) 시점의 값 고정.
// 각 앱 로컬 사본(STATUS_COLORS 등)을 shared로 교체하면서 클래스 문자열이
// 1비트도 달라지지 않았음을 보증한다. 색을 바꾸려면 이 테스트도 함께 바꿔야 한다.

describe('상태 배지 클래스 — P2-46 교체 전후 값 동일성', () => {
  it('REQUEST: 구 로컬 사본(owner dashboard/mypage/status)과 동일하다', () => {
    expect(REQUEST_STATUS_BADGE_CLASSES).toEqual({
      open: 'bg-info-light text-info',
      matching: 'bg-warning-light text-warning',
      dealt: 'bg-success-light text-success',
      closed: 'bg-surface text-text-subtle',
    })
  })

  it('DEAL: 구 로컬 사본(owner/expert mypage·work)과 동일하다', () => {
    expect(DEAL_STATUS_BADGE_CLASSES).toEqual({
      quoted: 'bg-info-light text-info',
      working: 'bg-warning-light text-warning',
      done: 'bg-success-light text-success',
      cancelled: 'bg-error-light text-error',
    })
  })

  it('MATCHING: 구 로컬 사본(expert mypage)과 동일하다', () => {
    expect(MATCHING_STATUS_BADGE_CLASSES).toEqual({
      proposed: 'bg-info-light text-info',
      accepted: 'bg-success-light text-success',
      rejected: 'bg-error-light text-error',
    })
  })

  it('ORDER: 구 로컬 사본(owner/expert 4곳)과 동일하다', () => {
    expect(ORDER_STATUS_BADGE_CLASSES).toEqual({
      pending: 'bg-info-light text-info',
      paid: 'bg-warning-light text-warning',
      processing: 'bg-success-light text-success',
      completed: 'bg-surface text-text-subtle',
      cancelled: 'bg-error-light text-error',
    })
  })

  it('INVITATION: 구 로컬 사본(owner mypage·expert invitations·admin invitation-tab)과 동일하다', () => {
    expect(INVITATION_STATUS_BADGE_CLASSES).toEqual({
      invited: 'bg-info-light text-info',
      accepted: 'bg-success-light text-success',
      declined: 'bg-error-light text-error',
    })
  })

  it('DISPUTE: 구 로컬 사본(admin dispute-tab)과 동일하다', () => {
    expect(DISPUTE_STATUS_BADGE_CLASSES).toEqual({
      open: 'bg-error-light text-error',
      resolved: 'bg-success-light text-success',
    })
  })

  it('PACKAGE: 구 로컬 사본(partner services-list)과 동일하다', () => {
    expect(PACKAGE_STATUS_BADGE_CLASSES).toEqual({
      draft: 'bg-warning-light text-warning',
      published: 'bg-success-light text-success',
      archived: 'bg-surface text-text-subtle',
    })
  })

  it('PROVIDER: 구 로컬 사본(admin partner-tab)과 동일하다', () => {
    expect(PROVIDER_STATUS_BADGE_CLASSES).toEqual({
      pending: 'bg-warning-light text-warning',
      active: 'bg-success-light text-success',
      rejected: 'bg-error-light text-error',
      suspended: 'bg-surface text-text-subtle',
    })
  })
})

describe('배지 키 ↔ 라벨 키 정합 (한쪽만 추가되는 드리프트 방지)', () => {
  const pairs: Array<[string, Record<string, string>, Record<string, string>]> = [
    ['REQUEST', REQUEST_STATUS_BADGE_CLASSES, REQUEST_STATUS_LABELS],
    ['DEAL', DEAL_STATUS_BADGE_CLASSES, DEAL_STATUS_LABELS],
    ['MATCHING', MATCHING_STATUS_BADGE_CLASSES, MATCHING_STATUS_LABELS],
    ['ORDER', ORDER_STATUS_BADGE_CLASSES, ORDER_STATUS_LABELS],
    ['INVITATION', INVITATION_STATUS_BADGE_CLASSES, INVITATION_STATUS_LABELS],
    ['DISPUTE', DISPUTE_STATUS_BADGE_CLASSES, DISPUTE_STATUS_LABELS],
    ['PACKAGE', PACKAGE_STATUS_BADGE_CLASSES, PACKAGE_STATUS_LABELS],
    ['PROVIDER', PROVIDER_STATUS_BADGE_CLASSES, PROVIDER_STATUS_LABELS],
  ]

  it.each(pairs)('%s: 배지 키 집합 = 라벨 키 집합', (_name, badges, labels) => {
    expect(Object.keys(badges).sort()).toEqual(Object.keys(labels).sort())
  })
})
