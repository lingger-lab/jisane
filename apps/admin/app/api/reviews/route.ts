import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function POST(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { deal_id, rating, comment, internal_note } = body

  if (!deal_id) {
    return NextResponse.json({ error: 'deal_id is required' }, { status: 400 })
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 })
  }

  // 중복 확인
  const { data: existing } = await adminClient
    .from('review')
    .select('id')
    .eq('deal_id', deal_id)
    .eq('author_type', 'admin')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Review already exists' }, { status: 409 })
  }

  const { error } = await adminClient
    .from('review')
    .insert({
      deal_id,
      author_type: 'admin',
      rating,
      comment: comment || null,
      internal_note: internal_note || null,
    })

  if (error) {
    console.error('[reviews] review 등록 실패:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
