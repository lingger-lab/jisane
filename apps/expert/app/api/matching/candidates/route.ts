import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { findCandidates } from '@jisane/shared/matching-algo'
import type { ExpertRow } from '@jisane/shared/types'

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
    .select('id, title, detail, req_type, category_id')
    .eq('id', requestId)
    .single()

  if (reqError || !req) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // 활성 전문가 조회 (contact, email 등 민감 필드 제외)
  const { data: experts } = await adminClient
    .from('expert')
    .select('id, auth_user_id, name, field, career_years, intro, status, grade')
    .eq('status', 'active')
    .returns<ExpertRow[]>()

  const candidates = findCandidates(
    { title: req.title, detail: req.detail, req_type: req.req_type, category_id: req.category_id ?? null },
    experts || []
  )

  return NextResponse.json({
    candidates: candidates.map((c) => ({
      expert_id: c.expert.id,
      name: c.expert.name,
      field: c.expert.field,
      career_years: c.expert.career_years,
      score: c.score,
    })),
  })
}
