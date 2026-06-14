import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { request_id, partner_id } = body

  if (!request_id || !partner_id) {
    return NextResponse.json({ error: 'request_id and partner_id are required' }, { status: 400 })
  }

  // 의뢰 상태 확인
  const { data: req } = await adminClient
    .from('request')
    .select('id, status')
    .eq('id', request_id)
    .single()

  if (!req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  if (req.status !== 'open') {
    return NextResponse.json({ error: 'Request is not in open status' }, { status: 400 })
  }

  // matching 생성
  const { error: matchError } = await adminClient
    .from('matching')
    .insert({
      request_id,
      partner_id,
      status: 'proposed',
    })

  if (matchError) {
    return NextResponse.json({ error: matchError.message }, { status: 500 })
  }

  // request.status → 'matching'
  await adminClient
    .from('request')
    .update({ status: 'matching' })
    .eq('id', request_id)

  return NextResponse.json({ success: true })
}
