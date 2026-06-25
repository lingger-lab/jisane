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

  const { data: client } = await adminClient
    .from('client')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const { data: requests, error } = await adminClient
    .from('request')
    .select('id, client_id, title, detail, req_type, scope, budget_hope, status, created_at, updated_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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

  const { data: client } = await adminClient
    .from('client')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }

  const body = await request.json()
  const { title, detail, req_type, scope, budget_hope } = body

  if (!title?.trim() || !detail?.trim()) {
    return NextResponse.json({ error: 'title and detail are required' }, { status: 400 })
  }

  if (title.trim().length > 200) {
    return NextResponse.json({ error: '제목은 200자 이내로 입력해주세요.' }, { status: 400 })
  }
  if (detail.trim().length > 5000) {
    return NextResponse.json({ error: '내용은 5000자 이내로 입력해주세요.' }, { status: 400 })
  }

  const { data, error } = await adminClient.from('request').insert({
    client_id: client.id,
    title: title.trim(),
    detail: detail.trim(),
    req_type: req_type || null,
    scope: scope || null,
    budget_hope: budget_hope ? parseInt(budget_hope, 10) : null,
  }).select().single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ request: data }, { status: 201 })
}
