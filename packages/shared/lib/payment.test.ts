import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { buildOrderId, cancelPayment, confirmPayment, parseOrderId } from './payment'

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

// orderId 스킴 (설계 docs/16 §3.2·§11.4): build/parse 판별 유니온 + 레거시 하위호환.
// 오파싱 시 후속 404 → non-2xx → Toss 무한 재전송이므로 형식 검증은 보수적으로.
describe('buildOrderId / parseOrderId (판별 유니온 스킴)', () => {
  const TS = 1755000000000
  const UUID = '550e8400-e29b-41d4-a716-446655440000'

  it('deal round-trip: build → parse가 동일 kind·id를 복원한다', () => {
    const orderId = buildOrderId({ kind: 'deal', id: UUID }, TS)
    expect(orderId).toBe(`jisane_deal_${UUID}_${TS}`)
    expect(parseOrderId(orderId)).toEqual({ kind: 'deal', id: UUID })
  })

  it('subscription round-trip: build → parse가 동일 kind·id를 복원한다', () => {
    const orderId = buildOrderId({ kind: 'subscription', id: UUID }, TS)
    expect(orderId).toBe(`jisane_sub_${UUID}_${TS}`)
    expect(parseOrderId(orderId)).toEqual({ kind: 'subscription', id: UUID })
  })

  it('레거시 형식 jisane_{uuid}_{ts}는 kind deal로 하위호환 파싱된다', () => {
    expect(parseOrderId(`jisane_${UUID}_${TS}`)).toEqual({ kind: 'deal', id: UUID })
  })

  it('회귀 가드(§11.4): jisane_sub_{id}_{ts}는 subscription이며 절대 deal로 새지 않는다', () => {
    const parsed = parseOrderId(`jisane_sub_${UUID}_${TS}`)
    expect(parsed).not.toBeNull()
    expect(parsed!.kind).toBe('subscription')
    expect(parsed!.kind).not.toBe('deal')
    // 형식이 어긋난 sub도 레거시(deal, id='sub')로 흘러선 안 된다 — null이어야 한다.
    expect(parseOrderId('jisane_sub_12345')).toBeNull()
    expect(parseOrderId(`jisane_sub__${TS}`)).toBeNull()
    expect(parseOrderId(`jisane_sub_${UUID}_extra_${TS}`)).toBeNull()
  })

  it('오염/쓰레기 입력은 전부 null', () => {
    expect(parseOrderId('')).toBeNull()
    expect(parseOrderId('jisane')).toBeNull()
    expect(parseOrderId('foo_bar')).toBeNull()
    expect(parseOrderId('jisane__123')).toBeNull() // 빈 id
    expect(parseOrderId(`other_${UUID}_${TS}`)).toBeNull() // prefix 불일치
    expect(parseOrderId(`jisane-deal-${UUID}-${TS}`)).toBeNull() // 구분자 변형
    expect(parseOrderId(`jisane_${UUID}_notanumber`)).toBeNull() // ts 비숫자
    expect(parseOrderId(`jisane_deal_${UUID}`)).toBeNull() // ts 누락
    expect(parseOrderId(`jisane_deal__${TS}`)).toBeNull() // 빈 id (신규 형식)
    expect(parseOrderId(`jisane_deal_${UUID}_${TS}_extra`)).toBeNull() // 조각 초과
    expect(parseOrderId(`jisane_a_b_${TS}`)).toBeNull() // 레거시인데 언더스코어 포함 id
  })

  it('언더스코어가 섞인 id로는 orderId를 만들 수 없다(파싱 불능 orderId 사전 차단)', () => {
    expect(() => buildOrderId({ kind: 'deal', id: 'has_underscore' }, TS)).toThrow()
    expect(() => buildOrderId({ kind: 'subscription', id: '' }, TS)).toThrow()
  })

  // REFUTE(적대적 검증) 발견 반례 — RED = 구현 결함 증명 (docs/16 §11.4 클래스).
  // buildOrderId의 가드 계약: "파싱 불능 orderId는 세션 생성 시점에 즉시 throw"(payment.ts:38-42).
  // 그런데 id만 검사하고 timestamp는 검사하지 않는다. 비정수 timestamp(NaN·소수·음수·
  // Infinity·2^70급 지수표기)는 throw 없이 build되지만 문자열화가 TIMESTAMP_RE(^\d+$)를
  // 통과하지 못해 parseOrderId가 null → 결제 완료 후 콜백 영구 거부 → Toss 무한 재전송.
  // 현재 유일 호출자는 Date.now()라 잠복 상태지만, §3.2 chargeBillingKey 경로가 이 export를
  // 직접 쓰는 순간 실사고 경로가 된다.
  describe('적대검증 반례 회귀 가드 (timestamp 검증)', () => {
    it('비정수/unsafe timestamp는 파싱 불능 orderId를 만들므로 build 시점에 throw', () => {
      for (const badTs of [NaN, 1.5, -1, Infinity, 2 ** 70]) {
        // 수정 전: throw 없이 jisane_deal_..._NaN / _1.5 / _-1 / _Infinity / _1.18e+21 생성됨.
        // 2^70은 정수지만 String()이 지수표기라 isInteger로는 부족 → isSafeInteger로 차단.
        expect(() => buildOrderId({ kind: 'deal', id: UUID }, badTs), `ts=${badTs}`).toThrow()
      }
    })

    it('반례(왕복 불변식): build가 throw하지 않았다면 parse는 반드시 성공해야 한다', () => {
      let orderId: string | null = null
      try {
        orderId = buildOrderId({ kind: 'subscription', id: UUID }, NaN)
      } catch {
        // throw했다면 계약 준수 — 왕복 검사 불필요
      }
      if (orderId !== null) {
        // build가 성공시킨 orderId가 parse에서 null이면 §11.4(콜백 영구거부) 재발
        expect(parseOrderId(orderId)).not.toBeNull()
      }
    })
  })
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
