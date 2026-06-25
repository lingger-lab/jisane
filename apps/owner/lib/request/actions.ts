'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

interface CreateRequestState {
  error?: string
}

export async function createRequest(
  _prev: CreateRequestState,
  formData: FormData
): Promise<CreateRequestState> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const title = formData.get('title') as string | null
  const detail = formData.get('detail') as string | null
  const reqType = formData.get('req_type') as string | null
  const scope = formData.get('scope') as string | null
  const budgetHopeRaw = formData.get('budget_hope') as string | null
  const budgetHope = budgetHopeRaw ? parseInt(budgetHopeRaw, 10) : null

  if (!title || !title.trim()) {
    return { error: '의뢰 제목을 입력해주세요.' }
  }
  if (!detail || !detail.trim()) {
    return { error: '의뢰 내용을 입력해주세요.' }
  }

  // client_id 조회 (없으면 자동 생성 — 시니어가 기업 역할도 사용하는 경우)
  let { data: client } = await adminClient
    .from('client')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) {
    const provider = (user.app_metadata?.provider as string) || 'google'
    const { data: newClient } = await adminClient
      .from('client')
      .insert({ auth_user_id: user.id, provider, email: user.email! })
      .select('id')
      .single()
    client = newClient
  }

  if (!client) {
    return { error: '계정 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  const { error } = await adminClient.from('request').insert({
    client_id: client.id,
    title: title.trim(),
    detail: detail.trim(),
    req_type: reqType || null,
    scope: scope || null,
    budget_hope: budgetHope,
  })

  if (error) {
    return { error: '의뢰 등록에 실패했습니다. 다시 시도해주세요.' }
  }

  redirect('/status?success=request_created')
}
