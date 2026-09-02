'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { isKakaoConfigured, sendFriendtalk, sendLms } from '@jisane/shared/notify/kakao'
import { getMarketingConsentedContacts } from '@jisane/shared/consent/consent'
import { composeAdMessage, isAdSendBlockedHour } from '@jisane/shared/messaging/compose'

// 친구톡 수신거부 안내(카카오는 채널 차단으로 수신거부). LMS는 SOLAPI_UNSUB_NUMBER(080)로.
const UNSUB_FRIENDTALK = '카카오톡 채널 차단'
const MAX_TARGETS = 2000 // 발송 상한(런어웨이 방지)

export async function createCampaign(
  _prev: { ok?: boolean; error?: string },
  formData: FormData,
): Promise<{ ok?: boolean; error?: string }> {
  if (!(await verifyAdmin())) return { error: '권한이 없습니다.' }
  const title = ((formData.get('title') as string) || '').trim()
  const channel = formData.get('channel') as string
  const body = ((formData.get('body') as string) || '').trim()
  if (!title || !body) return { error: '제목과 본문을 입력해주세요.' }
  if (channel !== 'friendtalk' && channel !== 'lms') return { error: '채널을 선택해주세요.' }

  const scheduledRaw = (formData.get('scheduled_at') as string | null)?.trim() || null
  const scheduledAt = scheduledRaw ? new Date(scheduledRaw).toISOString() : null

  const targets = await getMarketingConsentedContacts()
  const { error } = await adminClient.from('message_campaign').insert({
    title,
    channel,
    body,
    status: scheduledAt ? 'scheduled' : 'draft',
    scheduled_at: scheduledAt,
    target_count: targets.length,
  })
  if (error) return { error: '캠페인 생성에 실패했습니다.' }
  revalidatePath('/messaging')
  return { ok: true }
}

export async function sendCampaign(campaignId: string): Promise<{ ok?: boolean; error?: string }> {
  if (!(await verifyAdmin())) return { error: '권한이 없습니다.' }
  if (!isKakaoConfigured()) {
    return { error: '발송 채널이 아직 구성되지 않았습니다. 카카오 발신프로필·대행사 키 설정 후 발송할 수 있습니다.' }
  }
  // 광고성 야간 발송 금지(KST 기준 — Vercel은 UTC라 +9 보정)
  const kstHour = (new Date().getUTCHours() + 9) % 24
  if (isAdSendBlockedHour(kstHour)) {
    return { error: '광고성 정보는 21시~08시(KST)에 발송할 수 없습니다.' }
  }

  const { data: camp } = await adminClient.from('message_campaign').select('*').eq('id', campaignId).single()
  if (!camp) return { error: '캠페인을 찾을 수 없습니다.' }
  if (camp.status === 'sending' || camp.status === 'done') {
    return { error: '이미 발송했거나 발송 중입니다.' }
  }

  const targets = (await getMarketingConsentedContacts()).slice(0, MAX_TARGETS)
  if (targets.length === 0) return { error: '마케팅 수신 동의자가 없습니다.' }

  await adminClient.from('message_campaign').update({ status: 'sending' }).eq('id', campaignId)

  const unsub = camp.channel === 'lms' ? process.env.SOLAPI_UNSUB_NUMBER || '' : UNSUB_FRIENDTALK
  const text = composeAdMessage(camp.body as string, camp.channel, unsub)

  let sent = 0
  let failed = 0
  for (const t of targets) {
    const res =
      camp.channel === 'friendtalk'
        ? await sendFriendtalk(t.phone, text)
        : await sendLms(t.phone, text, camp.title as string)
    await adminClient.from('message_send_log').insert({
      campaign_id: campaignId,
      phone: t.phone,
      owner_id: t.ownerId,
      expert_id: t.expertId,
      status: res.ok ? 'sent' : 'failed',
      provider_message_id: res.providerId ?? null,
      error: res.error ?? null,
      sent_at: res.ok ? new Date().toISOString() : null,
    })
    if (res.ok) sent++
    else failed++
  }

  await adminClient
    .from('message_campaign')
    .update({
      status: failed === targets.length ? 'failed' : 'done',
      sent_count: sent,
      failed_count: failed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', campaignId)

  revalidatePath('/messaging')
  return { ok: true }
}
