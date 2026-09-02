import { createHmac, randomBytes } from 'crypto'

/**
 * 카카오 친구톡/문자(LMS) 발송 어댑터 — 서버 전용. 발송대행사 Solapi HTTP API 기준.
 *
 * **키 미주입 시 dormant(no-op)** — SOLAPI_API_KEY/SECRET(+친구톡 KAKAO_PF_ID, 문자 SOLAPI_SENDER)이
 * 설정되기 전에는 아무것도 발송하지 않는다(isEmailEnabled 패턴). 키를 넣으면 코드 변경 없이 켜진다.
 * 계약: 절대 throw하지 않고 결과 객체 반환({ok,...}).
 *
 * ⚠️ 라이브 미검증: Solapi v4 요청 형태로 구현했으나 실제 발신프로필/키로 검증된 적 없다.
 * 채널·발신프로필·대행사 키가 준비되면 이 파일의 요청 형태(엔드포인트·필드·서명)를 한 번 검증할 것.
 */

const SOLAPI_ENDPOINT = 'https://api.solapi.com/messages/v4/send'

export function isKakaoConfigured(): boolean {
  if (typeof window !== 'undefined') {
    throw new Error('isKakaoConfigured는 서버에서만 호출할 수 있습니다')
  }
  return Boolean(process.env.SOLAPI_API_KEY && process.env.SOLAPI_API_SECRET)
}

export interface SendResult {
  ok: boolean
  providerId?: string
  error?: string
}

interface SolapiMessage {
  to: string
  from?: string
  text: string
  type: 'LMS' | 'CTA'
  subject?: string
  kakaoOptions?: { pfId: string }
}

function authHeader(key: string, secret: string): string {
  const date = new Date().toISOString()
  const salt = randomBytes(16).toString('hex')
  const signature = createHmac('sha256', secret).update(date + salt).digest('hex')
  return `HMAC-SHA256 apiKey=${key}, date=${date}, salt=${salt}, signature=${signature}`
}

async function solapiSend(message: SolapiMessage): Promise<SendResult> {
  const key = process.env.SOLAPI_API_KEY
  const secret = process.env.SOLAPI_API_SECRET
  if (!key || !secret) return { ok: false, error: '발송 채널이 아직 구성되지 않았습니다.' }
  try {
    const res = await fetch(SOLAPI_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: authHeader(key, secret), 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
      signal: AbortSignal.timeout(10_000),
    })
    const data = (await res.json().catch(() => ({}))) as { messageId?: string; errorMessage?: string }
    if (!res.ok) return { ok: false, error: data.errorMessage || `발송 실패(${res.status})` }
    return { ok: true, providerId: data.messageId }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

/** 친구톡(광고성) 1건 — 채널 친구·마케팅 수신동의자 대상. KAKAO_PF_ID(발신프로필) 필요. */
export async function sendFriendtalk(to: string, text: string): Promise<SendResult> {
  if (!isKakaoConfigured()) return { ok: false, error: '발송 채널이 아직 구성되지 않았습니다.' }
  const pfId = process.env.KAKAO_PF_ID
  if (!pfId) return { ok: false, error: '카카오 발신프로필(KAKAO_PF_ID)이 설정되지 않았습니다.' }
  return solapiSend({
    to,
    from: process.env.SOLAPI_SENDER,
    text,
    type: 'CTA',
    kakaoOptions: { pfId },
  })
}

/** 문자(LMS, 광고성) 1건 — 친구톡 미도달 보완용. SOLAPI_SENDER(등록 발신번호) 필요. */
export async function sendLms(to: string, text: string, subject?: string): Promise<SendResult> {
  if (!isKakaoConfigured()) return { ok: false, error: '발송 채널이 아직 구성되지 않았습니다.' }
  const from = process.env.SOLAPI_SENDER
  if (!from) return { ok: false, error: '발신번호(SOLAPI_SENDER)가 설정되지 않았습니다.' }
  return solapiSend({ to, from, text, type: 'LMS', subject })
}
