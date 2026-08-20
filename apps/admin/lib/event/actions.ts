'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'

interface ActionState {
  error?: string
}

const EVENT = 'senior100'
const VALID_STATUS = ['submitted', 'valid', 'paid', 'rejected']

/** 공개 입력 경계 정리 — trim + 길이 상한(스팸/과대입력 방어) */
function clip(v: FormDataEntryValue | null, max: number): string {
  return ((v as string | null) ?? '').trim().slice(0, max)
}

/** 공개 추천 접수 — verifyAdmin 없음(공개 폼). service-role(adminClient)로 insert. */
export async function submitEventReferral(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const referrer_name = clip(formData.get('referrer_name'), 60)
  const referrer_contact = clip(formData.get('referrer_contact'), 60)
  const referrer_email = clip(formData.get('referrer_email'), 120) || null
  const referee_name = clip(formData.get('referee_name'), 60)
  const referee_contact = clip(formData.get('referee_contact'), 60)
  const note = clip(formData.get('note'), 500) || null

  if (!referrer_name || !referrer_contact) return { error: '추천인 성함과 연락처를 입력해주세요.' }
  if (!referee_name || !referee_contact) return { error: '추천하신 분의 성함과 연락처를 입력해주세요.' }

  const { error } = await adminClient.from('event_referral').insert({
    event_code: EVENT,
    referrer_name,
    referrer_contact,
    referrer_email,
    referee_name,
    referee_contact,
    note,
  })
  if (error) {
    console.error('[event] submitEventReferral failed:', error.message)
    return { error: '접수에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
  redirect('/event/senior100?success=created')
}

/** 관리자 — 접수 상태 변경(접수/유효/지급/반려) */
export async function updateEventReferralStatus(id: string, status: string): Promise<ActionState> {
  await verifyAdmin()
  if (!VALID_STATUS.includes(status)) return { error: '잘못된 상태값입니다.' }
  const { error } = await adminClient
    .from('event_referral')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/event-referrals')
  return {}
}

/** 관리자 — 발표 공지 편집(업서트). 게시 시 이벤트 페이지 배너에 노출. */
export async function upsertEventNotice(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await verifyAdmin()
  const body = clip(formData.get('body'), 1000) || null
  const published = formData.get('published') === 'on'
  const { error } = await adminClient
    .from('event_notice')
    .upsert(
      { event_code: EVENT, body, published, updated_at: new Date().toISOString() },
      { onConflict: 'event_code' }
    )
  if (error) {
    console.error('[event] upsertEventNotice failed:', error.message)
    return { error: '공지 저장에 실패했습니다.' }
  }
  revalidatePath('/dashboard/event-referrals')
  redirect('/dashboard/event-referrals?success=saved')
}
