'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

async function verifyAdmin(): Promise<{ email: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) throw new Error('Unauthorized')

  const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim())
  if (!adminEmails.includes(user.email)) throw new Error('Forbidden')

  return { email: user.email }
}

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
