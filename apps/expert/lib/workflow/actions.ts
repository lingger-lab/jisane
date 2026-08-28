'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { flagIfRisky } from '@jisane/shared/audit/message-audit'
import type { WorkflowStep, StepStatus } from '@jisane/shared/types'

async function verifyDealExpertOwnership(dealId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: deal } = await adminClient
    .from('deal')
    .select('id, status, expert_id')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return { error: '거래 정보를 찾을 수 없습니다.' }
  }

  const { data: expert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert || deal.expert_id !== expert.id) {
    return { error: '접근 권한이 없습니다.' }
  }

  return { deal }
}

export async function updateWorkflowStep(
  dealId: string,
  step: WorkflowStep,
  newStatus: StepStatus,
  note?: string
): Promise<{ error?: string }> {
  const result = await verifyDealExpertOwnership(dealId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  // deal.status 게이트: 이미 완료(done)된 거래는 워크플로 단계를 변경할 수 없다(정산·전달 후
  // 재작성 차단, 감사 docs/11 P2-33 — 기존엔 deal.status를 읽고도 쓰지 않았음).
  if ('deal' in result && result.deal?.status === 'done') {
    return { error: '이미 완료된 거래는 단계를 변경할 수 없습니다.' }
  }

  // 전이 검증: pending→in_progress→done 순서만 허용(건너뛰기·되돌리기·임의 상태 직접
  // 쓰기 차단). 이 검증은 죽은 API 라우트에만 있고 라이브 액션엔 없었다(감사 docs/11 P1-5·P2-33).
  // 라이브 UI(workflow-form)도 이 순서로만 진행하므로 UI를 깨지 않는다.
  const { data: current } = await adminClient
    .from('deal_workflow')
    .select('status')
    .eq('deal_id', dealId)
    .eq('step', step)
    .single()

  if (current) {
    const VALID_TRANSITIONS: Record<string, string[]> = {
      pending: ['in_progress'],
      in_progress: ['done'],
      done: [],
    }
    if (!VALID_TRANSITIONS[current.status]?.includes(newStatus)) {
      return { error: `상태 전이 불가: ${current.status} → ${newStatus}` }
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
    return { error: '단계 업데이트에 실패했습니다.' }
  }

  revalidatePath(`/work/${dealId}`)
  return {}
}

export async function submitWork(dealId: string): Promise<{ error?: string }> {
  const result = await verifyDealExpertOwnership(dealId)

  if ('error' in result && result.error) {
    return { error: result.error }
  }

  // deliver 단계가 done인지 확인
  const { data: deliverStep } = await adminClient
    .from('deal_workflow')
    .select('status')
    .eq('deal_id', dealId)
    .eq('step', 'deliver')
    .single()

  if (!deliverStep || deliverStep.status !== 'done') {
    return { error: '납품 단계를 먼저 완료해주세요.' }
  }

  // 작업 제출 시각 기록(멱등 CAS) — working이고 아직 미제출일 때만. status enum은 그대로(working 유지),
  // 검수(confirmDealOp)는 계속 발주자가 트리거한다. 이 타임스탬프로 '검수 대기'를 표시(파생).
  const deal = 'deal' in result ? result.deal : null
  await adminClient
    .from('deal')
    .update({ work_submitted_at: new Date().toISOString() })
    .eq('id', dealId)
    .eq('status', 'working')
    .is('work_submitted_at', null)

  // 스레드에 제출 알림 — 발주자·관리자에게 검수요청이 상태+메시지로 동시에 도달(submitWork no-op 해소)
  if (deal?.expert_id) {
    const body = '[작업 제출] 납품을 완료했습니다 — 검수를 요청드립니다.'
    const { data: msg } = await adminClient
      .from('deal_message')
      .insert({ deal_id: dealId, sender_type: 'expert', sender_id: deal.expert_id, content: body })
      .select('id')
      .single()
    if (msg?.id) await flagIfRisky('deal', msg.id as string, body)
  }

  revalidatePath(`/work/${dealId}`)
  return {}
}
