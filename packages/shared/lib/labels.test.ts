import { describe, it, expect } from 'vitest'
import { ORDER_STATUS_LABELS, EXPERT_GRADE_LABELS } from './labels'

// 중복 제거 리팩터링(감사 docs/11 P2-14·P3-73) 시점의 라벨 값 고정.
// 로컬 사본(ORDER_STATUS_LABELS_FALLBACK, GRADE_LABEL)을 shared 단일 소스로
// 교체하면서 값이 1비트도 달라지지 않았음을 보증한다.

describe('ORDER_STATUS_LABELS — P2-14 교체 전후 값 동일성', () => {
  it('구 order-labels.ts 사본과 동일한 키·값이다', () => {
    expect(ORDER_STATUS_LABELS).toEqual({
      pending: '접수',
      paid: '결제 완료',
      processing: '진행 중',
      completed: '완료',
      cancelled: '취소',
    })
  })
})

describe('EXPERT_GRADE_LABELS — P3-73 교체 전후 값 동일성', () => {
  it('구 GRADE_LABEL 사본(expert-card·상세 페이지)과 동일한 키·값이다', () => {
    expect(EXPERT_GRADE_LABELS).toEqual({
      veteran: '베테랑',
      standard: '시니어지식인',
      new: '신규',
    })
  })
})
