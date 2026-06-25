'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import type { WorkflowStep, StepStatus } from '@jisane/shared/types'

async function verifyDealPartnerOwnership(dealId: string) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: deal } = await adminClient
    .from('deal')
    .select('id, status, partner_id')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return { error: '거래 정보를 찾을 수 없습니다.' }
  }

  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner || deal.partner_id !== partner.id) {
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
  const result = await verifyDealPartnerOwnership(dealId)

  if ('error' in result && result.error) {
    return { error: result.error }
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
  const result = await verifyDealPartnerOwnership(dealId)

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

  // 안내: 관리자 확인 후 기업 검수로 전환됨
  // Phase 6에서 관리자가 deal.status 변경 처리
  revalidatePath(`/work/${dealId}`)
  return {}
}
