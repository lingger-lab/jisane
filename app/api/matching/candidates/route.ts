import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'
import { findCandidates } from '@/lib/matching-algo'
import type { PartnerRow } from '@/lib/types'

export async function GET(request: Request) {
  // 관리자 인증: ADMIN_SECRET 헤더 확인
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const requestId = searchParams.get('request_id')

  if (!requestId) {
    return NextResponse.json({ error: 'request_id is required' }, { status: 400 })
  }

  // 의뢰 정보 조회
  const { data: req, error: reqError } = await adminClient
    .from('request')
    .select('id, title, detail, req_type')
    .eq('id', requestId)
    .single()

  if (reqError || !req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // 활성 파트너 전체 조회
  const { data: partners } = await adminClient
    .from('partner')
    .select('*')
    .eq('status', 'active')

  const candidates = findCandidates(
    { title: req.title, detail: req.detail, req_type: req.req_type },
    (partners || []) as PartnerRow[]
  )

  return NextResponse.json({
    candidates: candidates.map((c) => ({
      partner_id: c.partner.id,
      name: c.partner.name,
      field: c.partner.field,
      career_yrs: c.partner.career_yrs,
      score: c.score,
    })),
  })
}
