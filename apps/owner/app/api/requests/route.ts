import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function GET() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: ownerRow } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!ownerRow) {
    return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
  }

  const { data: requests, error } = await adminClient
    .from('request')
    .select('id, owner_id, title, detail, req_type, scope, budget_hope, status, created_at, updated_at')
    .eq('owner_id', ownerRow.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[api/requests] GET 의뢰 목록 조회 실패:', error)
    return NextResponse.json({ error: '의뢰 목록을 불러오지 못했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ requests })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: ownerRow } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!ownerRow) {
    return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '요청 형식이 올바르지 않습니다.' }, { status: 400 })
  }
  const { title, detail, req_type, scope, budget_hope } = body as {
    title?: string
    detail?: string
    req_type?: string
    scope?: string
    budget_hope?: string | number | null
  }

  if (!title?.trim() || !detail?.trim()) {
    return NextResponse.json({ error: 'title and detail are required' }, { status: 400 })
  }

  if (title.trim().length > 200) {
    return NextResponse.json({ error: '제목은 200자 이내로 입력해주세요.' }, { status: 400 })
  }
  if (detail.trim().length > 5000) {
    return NextResponse.json({ error: '내용은 5000자 이내로 입력해주세요.' }, { status: 400 })
  }

  let budgetHope: number | null = null
  if (budget_hope != null && budget_hope !== '') {
    budgetHope = Number(budget_hope)
    if (!Number.isSafeInteger(budgetHope) || budgetHope < 0) {
      return NextResponse.json({ error: '희망 예산은 0 이상의 정수로 입력해주세요.' }, { status: 400 })
    }
  }

  const { data, error } = await adminClient.from('request').insert({
    owner_id: ownerRow.id,
    title: title.trim(),
    detail: detail.trim(),
    req_type: req_type || null,
    scope: scope || null,
    budget_hope: budgetHope,
  }).select().single()

  if (error) {
    console.error('[api/requests] POST 의뢰 생성 실패:', error)
    return NextResponse.json({ error: '의뢰 등록에 실패했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ request: data }, { status: 201 })
}
