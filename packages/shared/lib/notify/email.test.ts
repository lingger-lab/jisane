import { describe, it, expect, vi, afterEach } from 'vitest'
import { isEmailEnabled, sendEmail, notifyAdmin } from './email'

describe('notify/email (P1-2 — 기본 dormant, never-throw)', () => {
  const env = { ...process.env }
  afterEach(() => {
    process.env = { ...env }
    vi.restoreAllMocks()
  })

  it('키 미주입이면 isEmailEnabled false (dormant)', () => {
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    expect(isEmailEnabled()).toBe(false)
  })

  it('RESEND_API_KEY + EMAIL_FROM 있으면 true', () => {
    process.env.RESEND_API_KEY = 'k'
    process.env.EMAIL_FROM = 'a@b.c'
    expect(isEmailEnabled()).toBe(true)
  })

  it('비활성이면 sendEmail은 fetch 호출 없이 no-op', async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.EMAIL_FROM
    const f = vi.spyOn(globalThis, 'fetch')
    await sendEmail('x@y.z', 's', 't')
    expect(f).not.toHaveBeenCalled()
  })

  it('notifyAdmin은 수신자 주소가 없어도 throw하지 않는다(fire-and-forget)', async () => {
    delete process.env.ADMIN_NOTIFY_EMAIL
    delete process.env.ADMIN_EMAILS
    await expect(notifyAdmin('s', 't')).resolves.toBeUndefined()
  })
})
