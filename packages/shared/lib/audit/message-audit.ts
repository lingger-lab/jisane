import 'server-only'

import { adminClient } from '../supabase/admin'
import { scanMessageRisk } from './message-risk'

/**
 * 은밀 감사 저장 계층(서버 전용). 위험 메시지를 message_audit에 lazy insert(플래그)한다.
 * **fire-and-forget** — 감사 실패가 메시지 전송을 절대 막지 않는다(결정: 통과 우선).
 * message_audit는 회원 앱 코드가 참조하지 않고 RLS 정책 0(service-role 전용)이라 회원에 노출되지 않는다.
 */

export type MessageAuditChannel = 'deal' | 'service_order'

/** 위험 패턴이 있으면 감사 큐에 미검토(unreviewed)로 등록. 위험 없으면 아무것도 하지 않음(행 없음). */
export async function flagIfRisky(
  channel: MessageAuditChannel,
  messageId: string,
  content: string,
): Promise<void> {
  try {
    const reasons = scanMessageRisk(content)
    if (reasons.length === 0) return
    const { error } = await adminClient.from('message_audit').insert({
      channel,
      message_id: messageId,
      status: 'unreviewed',
      flagged_reasons: reasons,
      auto_flagged: true,
    })
    if (error) console.error('[message-audit] flagIfRisky insert failed:', error.message)
  } catch (e) {
    console.error('[message-audit] flagIfRisky unexpected error:', e)
  }
}
