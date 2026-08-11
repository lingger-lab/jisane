import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function GET(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'working'

  const { data, error } = await adminClient
    .from('deal')
    .select(`
      id, work_fee, match_fee, total_pay, status, due_date, created_at,
      request:request!inner(id, title, req_type),
      expert:expert!inner(id, name, field)
    `)
    .eq('status', status)
    .order('created_at', { ascending: false })
    // 명시 상한 — status 필터가 있어도 done 등 누적 상태는 무한 성장한다(감사 docs/11 P3-16).
    // 최신순 100건이면 운영 조회 용도로 충분하고, 이상은 페이지네이션 파라미터 설계가 필요.
    .limit(100)

  if (error) {
    console.error('[admin/deals] deal 조회 실패:', error)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }

  // 각 deal의 workflow 조회
  const dealIds = (data || []).map((d: Record<string, unknown>) => d.id as string)
  let workflows: Record<string, unknown>[] = []
  if (dealIds.length > 0) {
    const { data: wfData } = await adminClient
      .from('deal_workflow')
      .select('deal_id, step, status, done_at')
      .in('deal_id', dealIds)
      .order('created_at', { ascending: true })
    workflows = wfData || []
  }

  // deal별로 workflow 그룹핑
  const workflowMap: Record<string, Record<string, unknown>[]> = {}
  for (const wf of workflows) {
    const did = wf.deal_id as string
    if (!workflowMap[did]) workflowMap[did] = []
    workflowMap[did].push(wf)
  }

  const deals = (data || []).map((d: Record<string, unknown>) => ({
    ...d,
    workflows: workflowMap[d.id as string] || [],
  }))

  return NextResponse.json({ deals })
}
