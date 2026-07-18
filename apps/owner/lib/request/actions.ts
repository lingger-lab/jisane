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
    return { error: '로그인이 필요합니다. 상단의 로그인 버튼을 이용해주세요.' }
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

  // owner + category 병렬 조회
  const [ownerResult, catResult] = await Promise.all([
    adminClient.from('owner').select('id').eq('auth_user_id', user.id).single(),
    reqType
      ? adminClient.from('category').select('id').eq('label', reqType).eq('depth', 1).single()
      : Promise.resolve({ data: null }),
  ])

  let owner = ownerResult.data
  if (!owner) {
    const provider = (user.app_metadata?.provider as string) || 'google'
    const { data: newOwner } = await adminClient
      .from('owner')
      .insert({ auth_user_id: user.id, provider, email: user.email! })
      .select('id')
      .single()
    owner = newOwner
  }

  if (!owner) {
    return { error: '계정 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  const categoryId = catResult.data?.id || null

  const { error } = await adminClient.from('request').insert({
    owner_id: owner.id,
    title: title.trim(),
    detail: detail.trim(),
    req_type: reqType || null,
    scope: scope || null,
    budget_hope: budgetHope,
    category_id: categoryId,
  })

  if (error) {
    return { error: '의뢰 등록에 실패했습니다. 다시 시도해주세요.' }
  }

  redirect('/status?success=request_created')
}
