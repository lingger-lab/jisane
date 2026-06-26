'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { DealWithClientId } from '@jisane/shared/query-types'

async function getClientId(): Promise<string> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: client } = await adminClient
    .from('client')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) redirect('/')

  return client.id
}

async function verifyDealOwnership(dealId: string, clientId: string) {
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, request_id, request:request!inner(id, client_id)')
    .eq('id', dealId)
    .returns<DealWithClientId[]>()
    .single()

  if (!deal) return null

  if (deal.request.client_id !== clientId) return null

  return { dealId: deal.id, requestId: deal.request.id }
}

export async function sendOwnerMessage(
  dealId: string,
  content: string
): Promise<{ error?: string }> {
  const clientId = await getClientId()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }
  if (content.length > 1000) return { error: '메시지는 1000자 이내로 입력해주세요.' }

  const ownership = await verifyDealOwnership(dealId, clientId)
  if (!ownership) return { error: '접근 권한이 없습니다.' }

  const { error } = await adminClient
    .from('deal_message')
    .insert({
      deal_id: dealId,
      sender_type: 'client',
      sender_id: clientId,
      content: content.trim(),
    })

  if (error) return { error: error.message }

  revalidatePath(`/status/${ownership.requestId}`)
  return {}
}

export async function sendDealInquiry(
  dealId: string,
  content: string,
  category: 'deal_quote' | 'deal_issue'
): Promise<{ error?: string }> {
  const clientId = await getClientId()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }

  const ownership = await verifyDealOwnership(dealId, clientId)
  if (!ownership) return { error: '접근 권한이 없습니다.' }

  const { error } = await adminClient
    .from('inquiry')
    .insert({
      author_id: clientId,
      author_type: 'client',
      category: `${category}:${dealId}`,
      content: content.trim(),
      status: 'open',
    })

  if (error) return { error: error.message }

  revalidatePath(`/status/${ownership.requestId}`)
  return {}
}
