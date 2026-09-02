import { createHmac } from 'crypto'

/**
 * 수신거부(unsubscribe) 원클릭 링크용 서명 토큰 — 서버 전용(HMAC, secret 필요).
 * 토큰 = base64url(phone).base64url(HMAC-SHA256(phone))[0:24]. phone은 토큰에 내장되어
 * 별도 파라미터 불필요. 위조 방지는 HMAC으로. (개인정보=본인 번호이므로 base64 가역이어도 무해)
 */

function sig(phone: string, secret: string): string {
  return createHmac('sha256', secret).update(phone).digest('base64url').slice(0, 24)
}

export function signUnsubscribeToken(phone: string, secret: string): string {
  const p = Buffer.from(phone).toString('base64url')
  return `${p}.${sig(phone, secret)}`
}

/** 토큰 검증 → 유효하면 phone, 아니면 null. */
export function parseUnsubscribeToken(token: string, secret: string): string | null {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [p, s] = parts
  let phone: string
  try {
    phone = Buffer.from(p, 'base64url').toString('utf8')
  } catch {
    return null
  }
  if (!phone) return null
  return s === sig(phone, secret) ? phone : null
}
