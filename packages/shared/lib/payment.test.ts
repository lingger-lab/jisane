import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cancelPayment, confirmPayment } from './payment'

// 회귀 가드(감사 docs/11 P2-63·P3-X): cancelPayment는 confirmPayment와 동일하게
// 타임아웃/네트워크 장애에서 절대 throw하지 않고 {success:false}를 반환해야 한다.
// 호출자(refund 라우트)는 success만 검사하므로, throw가 새면 처리되지 않은 예외가
// 라우트 밖으로 나가고, 그 사이 Toss에서 취소가 이미 실행됐을 수 있다.

const fetchMock = vi.fn()

function timeoutError() {
  return new DOMException('The operation was aborted due to timeout', 'TimeoutError')
}

beforeEach(() => {
  process.env.TOSS_SECRET_KEY = 'test_sk'
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('cancelPayment 에러 계약 (never-throw)', () => {
  it('타임아웃 시 throw하지 않고 {success:false}와 한국어 에러를 반환한다', async () => {
    fetchMock.mockRejectedValueOnce(timeoutError())

    const result = await cancelPayment('pay_key_1', '고객 요청 환불', 10000, 'refund_s1_10000')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Toss 취소 요청 실패')
  })

  it('네트워크 실패 시에도 {success:false}로 반환한다', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'))

    const result = await cancelPayment('pay_key_1', '고객 요청 환불')

    expect(result.success).toBe(false)
    expect(result.error).toContain('Toss 취소 요청 실패')
  })

  it('non-2xx 응답이면 Toss 에러 메시지를 담아 {success:false}', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: '이미 취소된 결제입니다' }), { status: 400 })
    )

    const result = await cancelPayment('pay_key_1', '사유')

    expect(result.success).toBe(false)
    expect(result.error).toBe('이미 취소된 결제입니다')
  })

  it('성공 시 {success:true}, 타임아웃 signal이 요청에 실린다', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))

    const result = await cancelPayment('pay_key_1', '사유', 5000, 'refund_s1_5000')

    expect(result.success).toBe(true)
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    // 아웃바운드 타임아웃 배선 고정 — signal이 빠지면 행 걸린 연결이 라우트를 영구히 매단다.
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('refund_s1_5000')
  })
})

describe('confirmPayment 에러 계약 (기존 동작 고정)', () => {
  it('타임아웃 시 throw하지 않고 {success:false}를 반환한다', async () => {
    fetchMock.mockRejectedValueOnce(timeoutError())

    const result = await confirmPayment('pay_key_1', 'jisane_d1_123', 10000)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Toss confirm 요청 실패')
  })

  it('성공 시 {success:true}와 데이터, 타임아웃 signal이 요청에 실린다', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: 'DONE' }), { status: 200 })
    )

    const result = await confirmPayment('pay_key_1', 'jisane_d1_123', 10000)

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ status: 'DONE' })
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })
})
