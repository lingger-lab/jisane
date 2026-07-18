import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { WorkflowStep } from '@jisane/shared/types'

const VALID_STEPS: WorkflowStep[] = ['intake', 'structure', 'generate', 'verify', 'deliver']

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string; step: string }> }
) {
  const { id: dealId, step } = await props.params

  if (!VALID_STEPS.includes(step as WorkflowStep)) {
    return NextResponse.json({ error: 'Invalid step' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 소유권 확인
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, expert_id')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  const { data: expert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert || deal.expert_id !== expert.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { status: newStatus, note } = body

  if (newStatus !== 'pending' && newStatus !== 'in_progress' && newStatus !== 'done') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // 현재 상태 조회 후 전이 검증 (pending→in_progress→done)
  const { data: workflow } = await adminClient
    .from('deal_workflow')
    .select('status')
    .eq('deal_id', dealId)
    .eq('step', step)
    .single()

  if (workflow) {
    const currentStatus = workflow.status
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ['in_progress'],
      in_progress: ['done'],
      done: [],
    }
    if (!VALID_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      return NextResponse.json(
        { error: `상태 전이 불가: ${currentStatus} → ${newStatus}` },
        { status: 400 }
      )
    }
  }

  // 신규자 보증 게이트: verify 완료 시 관리자 승인 필요
  if (step === 'verify' && newStatus === 'done') {
    const { data: expertInfo } = await adminClient
      .from('expert')
      .select('is_newbie')
      .eq('id', expert.id)
      .single()

    if (expertInfo?.is_newbie) {
      await adminClient
        .from('deal_workflow')
        .update({ queue_status: 'pending_review' })
        .eq('deal_id', dealId)
        .eq('step', 'verify')

      return NextResponse.json(
        { error: '신규 전문가 결과물은 관리자 검수가 필요합니다. 검수 완료 후 전달됩니다.' },
        { status: 403 }
      )
    }
  }

  const updateData: Record<string, unknown> = { status: newStatus }
  if (note !== undefined) {
    updateData.note = note
  }
  if (newStatus === 'done') {
    updateData.done_at = new Date().toISOString()
  }

  const { error } = await adminClient
    .from('deal_workflow')
    .update(updateData)
    .eq('deal_id', dealId)
    .eq('step', step)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
