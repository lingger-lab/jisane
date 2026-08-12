/**
 * 최소 이메일 통지 어댑터 (설계 docs/16 §0 P1-2 · §7.1 SMS 어댑터의 이메일 선행).
 *
 * 무료 운영 중 매칭·견적·주문 도착을 통지해 "재방문(폴링) 의존 → 조용한 정체"를 방지한다.
 * **벤더 미정(§10-⑩)** — Resend HTTP API 기준으로 구현했고, `RESEND_API_KEY`·`EMAIL_FROM`이
 * 주입되기 전에는 dormant(no-op). 키를 넣으면 별도 코드 변경 없이 켜진다(isPaymentEnabled 패턴).
 *
 * 계약: **fire-and-forget** — 절대 throw하지 않는다. 도달 실패(수신자 이메일 부재 P3-34/72,
 * 네트워크 장애 등)는 정상 케이스로 로그만 남기고 본 흐름(거래·주문)을 막지 않는다.
 */
export function isEmailEnabled(): boolean {
  if (typeof window !== 'undefined') {
    throw new Error('isEmailEnabled는 서버에서만 호출할 수 있습니다')
  }
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)
}

/** 이메일 1통 발송. 비활성(키 미주입)이거나 실패해도 throw하지 않는다(로그만). */
export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  if (!isEmailEnabled() || !to) return

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.error(`[notify/email] 발송 실패(${res.status}) to=${to} subject="${subject}"`)
    }
  } catch (err) {
    console.error(
      `[notify/email] 발송 예외 to=${to}:`,
      err instanceof Error ? err.message : String(err),
    )
  }
}

/** 관리자 통지 — `ADMIN_NOTIFY_EMAIL` 또는 `ADMIN_EMAILS` 첫 주소로. */
export async function notifyAdmin(subject: string, text: string): Promise<void> {
  const to =
    process.env.ADMIN_NOTIFY_EMAIL ||
    (process.env.ADMIN_EMAILS || '').split(',')[0]?.trim() ||
    ''
  await sendEmail(to, subject, text)
}
