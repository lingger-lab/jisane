/* eslint-disable @typescript-eslint/no-explicit-any -- 라우트 mock은 런타임 shape만 필요 (refund route.test.ts 패턴) */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'

// 적대검증 반례 회귀 가드 (수정 반영 후 GREEN).
// docs/16 §3.2("웹훅 디스패치 kind 분기")·§11.4("웹훅 kind 라우팅") 요구사항.
// 수정 전에는 parsed.kind를 읽지 않아 구독 청구(jisane_sub_...) 웹훅이 subscription id를
// dealId로 confirmAndRecordDeposit에 넘김 → deal 404 → non-2xx → Toss 무한 재전송이었다.
// 수정: kind!=='deal'이면 confirm 미호출 + 200 ack(구독 처리는 빌링 단계).

const confirmMock = vi.fn()

vi.mock('@/lib/payments/confirm-deposit', () => ({
  confirmAndRecordDeposit: (...args: any[]) => confirmMock(...args),
}))

import { POST } from './route'

const SECRET = 'test-webhook-secret'

function signedRequest(payload: unknown) {
  const body = JSON.stringify(payload)
  const signature = crypto.createHmac('sha256', SECRET).update(body).digest('base64')
  return new Request('http://localhost/api/payments/webhook', {
    method: 'POST',
    headers: { 'toss-signature': signature, 'content-type': 'application/json' },
    body,
  })
}

beforeEach(() => {
  process.env.TOSS_WEBHOOK_SECRET = SECRET
  confirmMock.mockReset()
  confirmMock.mockResolvedValue({ ok: false, status: 404, error: 'Deal not found' })
})

describe('webhook kind 디스패치 (docs/16 §3.2·§11.4) 회귀 가드', () => {
  const SUB_ID = '7f9c24e8-3b2a-41d4-a716-446655440000'

  it('구독 orderId(jisane_sub_...)를 deal 입금 경로로 라우팅하지 않는다(200 ack)', async () => {
    const res = await POST(
      signedRequest({
        paymentKey: 'billing_pay_key_1',
        orderId: `jisane_sub_${SUB_ID}_1755000000000`,
        status: 'DONE',
      })
    )

    // 현재 구현: parsed.kind 무시 → confirmAndRecordDeposit(SUB_ID as dealId) 호출
    // → deal 404 → 404 응답(non-2xx) → Toss 무한 재전송.
    expect(confirmMock).not.toHaveBeenCalledWith(SUB_ID, expect.anything(), expect.anything())
    // 정당하게 결제 완료된 구독 웹훅을 영구 non-2xx로 거부해서도 안 된다(§11.4).
    expect(res.status).toBeLessThan(300)
  })

  it('deal orderId는 기존대로 confirmAndRecordDeposit로 라우팅된다 (회귀 가드)', async () => {
    confirmMock.mockResolvedValue({ ok: true, requestId: 'r1', alreadyProcessed: false })
    const DEAL_ID = '550e8400-e29b-41d4-a716-446655440000'

    const res = await POST(
      signedRequest({
        paymentKey: 'pay_key_1',
        orderId: `jisane_deal_${DEAL_ID}_1755000000000`,
        status: 'DONE',
      })
    )

    expect(confirmMock).toHaveBeenCalledWith(DEAL_ID, 'pay_key_1', `jisane_deal_${DEAL_ID}_1755000000000`)
    expect(res.status).toBe(200)
  })
})
