/**
 * 마케팅 발송 규정 준수 — 순수 함수(테스트 대상). 정보통신망법·카카오 광고성 메시지 규칙.
 * 광고성 메시지: 두문에 "(광고)", 말미에 무료수신거부 방법, 야간(21~08시) 발송 금지.
 */

export const AD_PREFIX = '(광고)'

export type MessageChannel = 'friendtalk' | 'lms'

/**
 * 광고성 본문 조립 — 고정 규제부(광고 표기·수신거부)를 UI에서 수정 불가로 자동 삽입.
 * friendtalk: 채널 차단 안내, lms: 무료수신거부 번호(080 등)를 unsubscribeInfo로 받는다.
 */
export function composeAdMessage(body: string, channel: MessageChannel, unsubscribeInfo: string): string {
  const trimmed = body.trim()
  const tail =
    channel === 'lms'
      ? `무료수신거부 ${unsubscribeInfo}`
      : `무료수신거부: ${unsubscribeInfo}`
  return `${AD_PREFIX} ${trimmed}\n\n${tail}`
}

/** 광고성 정보 야간 발송 금지 — 21:00~다음날 08:00. hour(0~23)만 받아 결정적. */
export function isAdSendBlockedHour(hour: number): boolean {
  return hour >= 21 || hour < 8
}

/** LMS 바이트 길이(한글 2, 그 외 1) — SMS(90B)/LMS 구분·초과 경고용. */
export function smsByteLength(text: string): number {
  let bytes = 0
  for (const ch of text) bytes += ch.charCodeAt(0) > 0x7f ? 2 : 1
  return bytes
}
