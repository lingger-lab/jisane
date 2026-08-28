'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { flagIfRisky } from '@jisane/shared/audit/message-audit'
import type { DealWithOwnerId } from '@jisane/shared/query-types'

async function getOwnerId(): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: owner } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!owner) redirect('/')

  return owner.id
}

async function verifyDealOwnership(dealId: string, ownerId: string) {
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, request_id, request:request!inner(id, owner_id)')
    .eq('id', dealId)
    .returns<DealWithOwnerId[]>()
    .single()

  if (!deal) return null

  if (deal.request.owner_id !== ownerId) return null

  return { dealId: deal.id, requestId: deal.request.id }
}

export async function sendOwnerMessage(
  dealId: string,
  content: string
): Promise<{ error?: string }> {
  const ownerId = await getOwnerId()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }
  if (content.length > 1000) return { error: '메시지는 1000자 이내로 입력해주세요.' }

  const ownership = await verifyDealOwnership(dealId, ownerId)
  if (!ownership) return { error: '접근 권한이 없습니다.' }

  const trimmed = content.trim()
  const { data: msg, error } = await adminClient
    .from('deal_message')
    .insert({ deal_id: dealId, sender_type: 'owner', sender_id: ownerId, content: trimmed })
    .select('id')
    .single()

  if (error) {
    console.error('[message/actions] sendOwnerMessage 저장 실패:', error)
    return { error: '메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
  if (msg?.id) await flagIfRisky('deal', msg.id as string, trimmed)

  revalidatePath(`/status/${ownership.requestId}`)
  return {}
}

/** 서비스 주문 메시지 — 발주 기업회원(owner). service_order.owner_id 소유검증 후 저장. */
export async function sendServiceOrderMessage(
  orderId: string,
  content: string
): Promise<{ error?: string }> {
  const ownerId = await getOwnerId()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }
  if (content.length > 1000) return { error: '메시지는 1000자 이내로 입력해주세요.' }

  const { data: order } = await adminClient
    .from('service_order')
    .select('id, owner_id')
    .eq('id', orderId)
    .single()

  if (!order || order.owner_id !== ownerId) return { error: '접근 권한이 없습니다.' }

  const trimmed = content.trim()
  const { data: msg, error } = await adminClient
    .from('service_order_message')
    .insert({ service_order_id: orderId, sender_type: 'owner', sender_id: ownerId, content: trimmed })
    .select('id')
    .single()

  if (error) {
    console.error('[message/actions] sendServiceOrderMessage(owner) 저장 실패:', error)
    return { error: '메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
  if (msg?.id) await flagIfRisky('service_order', msg.id as string, trimmed)

  revalidatePath(`/orders/${orderId}`)
  return {}
}

export async function sendDealInquiry(
  dealId: string,
  content: string,
  category: 'deal_quote' | 'deal_issue'
): Promise<{ error?: string }> {
  const ownerId = await getOwnerId()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }

  const ownership = await verifyDealOwnership(dealId, ownerId)
  if (!ownership) return { error: '접근 권한이 없습니다.' }

  const { error } = await adminClient
    .from('inquiry')
    .insert({
      author_id: ownerId,
      author_type: 'owner',
      category: `${category}:${dealId}`,
      content: content.trim(),
      status: 'open',
    })

  if (error) {
    console.error('[message/actions] sendDealInquiry 저장 실패:', error)
    return { error: '문의 전송에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }

  revalidatePath(`/status/${ownership.requestId}`)
  return {}
}
