'use server'

import { revalidatePath } from 'next/cache'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'

export async function sendAdminMessage(
  dealId: string,
  content: string
): Promise<{ error?: string }> {
  const { email } = await verifyAdmin()

  if (!content.trim()) return { error: '메시지를 입력해주세요.' }

  const { error } = await adminClient
    .from('deal_message')
    .insert({
      deal_id: dealId,
      sender_type: 'admin',
      sender_id: email,
      content: content.trim(),
    })

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}
