import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

/**
 * POST /api/disputes
 * 전문가(expert)가 리뷰 이의제기 생성
 * body: { review_id, reason }
 */
export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  const { data: expert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert) {
    return NextResponse.json({ error: '전문가 정보를 찾을 수 없습니다.' }, { status: 403 })
  }

  const body = await req.json()
  const { review_id, reason } = body as { review_id?: string; reason?: string }

  if (!review_id || !reason?.trim()) {
    return NextResponse.json({ error: 'review_id와 reason은 필수입니다.' }, { status: 400 })
  }

  // 리뷰 소유권 확인 (review → deal → expert_id)
  const { data: review } = await adminClient
    .from('review')
    .select('id, deal:deal!inner(expert_id)')
    .eq('id', review_id)
    .single()

  if (!review) {
    return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 })
  }

  const deal = review.deal as unknown as { expert_id: string } | null
  if (deal?.expert_id !== expert.id) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  // 중복 확인
  const { data: existing } = await adminClient
    .from('dispute')
    .select('id')
    .eq('target_type', 'review')
    .eq('target_id', review_id)
    .eq('status', 'open')
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: '이미 처리 중인 이의제기가 있습니다.' }, { status: 409 })
  }

  const { error: insertErr } = await adminClient
    .from('dispute')
    .insert({
      target_type: 'review',
      target_id: review_id,
      raised_by: 'expert',
      reason: reason.trim(),
    })

  if (insertErr) {
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
