import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

/**
 * POST /api/inquiry — 수동 문의 기록 (인증 필수)
 * GET /api/inquiry — 관리자용 문의 목록 (x-admin-secret 인증)
 */
export async function POST(request: Request) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { content, category } = body

  if (!content || typeof content !== 'string') {
    return NextResponse.json({ error: 'content is required' }, { status: 400 })
  }

  // author 판별
  const { data: expert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const { data: owner } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const authorId = expert?.id || owner?.id
  const authorType = expert ? 'expert' : owner ? 'owner' : null

  if (!authorId || !authorType) {
    return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
  }

  const { data: inquiry, error } = await adminClient
    .from('inquiry')
    .insert({
      author_id: authorId,
      author_type: authorType,
      category: category || '기타',
      content,
      status: 'open',
    })
    .select('id, content, category, status, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ inquiry }, { status: 201 })
}

export async function GET(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = adminClient
    .from('inquiry')
    .select('id, author_id, author_type, category, content, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ inquiries: data })
}
