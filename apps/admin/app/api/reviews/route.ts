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

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 })
  }

  // 중복 확인
  const { data: existing } = await adminClient
    .from('review')
    .select('id')
    .eq('deal_id', deal_id)
    .eq('author_type', 'gyeotae')
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Review already exists' }, { status: 409 })
  }

  const { error } = await adminClient
    .from('review')
    .insert({
      deal_id,
      author_type: 'gyeotae',
      rating,
      comment: comment || null,
      internal_note: internal_note || null,
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
