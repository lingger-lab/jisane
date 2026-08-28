'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'

/**
 * 메시지 감사 판정 저장 — message_audit upsert(회원 비노출). auto_flagged·flagged_reasons는
 * 페이로드에서 제외 → 자동플래그 행은 값 보존, 관리자 수동 플래그(무플래그 메시지)는 DB 기본값(false).
 */
export async function setMessageAuditVerdict(
  channel: 'deal' | 'service_order',
  messageId: string,
  verdict: 'normal' | 'suspicious' | 'violation',
  note?: string,
): Promise<{ error?: string }> {
  let email: string
  try {
    ;({ email } = await verifyAdmin())
  } catch {
    return { error: '관리자 권한이 필요합니다.' }
  }

  const { error } = await adminClient.from('message_audit').upsert(
    {
      channel,
      message_id: messageId,
      status: verdict,
      note: note?.trim() || null,
      audited_by: email,
      audited_at: new Date().toISOString(),
    },
    { onConflict: 'channel,message_id' },
  )

  if (error) {
    console.error('[audit] setMessageAuditVerdict failed:', error.message)
    return { error: '감사 판정 저장에 실패했습니다.' }
  }

  revalidatePath('/message-audit')
  return {}
}
