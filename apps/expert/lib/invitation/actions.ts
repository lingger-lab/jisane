'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { calcCapPricing } from '@jisane/shared/cap-pricing'
import type { WorkflowStep } from '@jisane/shared/types'

async function getExpertFromAuth(): Promise<{ expertId: string; hourlyRate: number | null }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: expert } = await adminClient
    .from('expert')
    .select('id, hourly_rate')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert) {
    redirect('/')
  }

  return { expertId: expert.id, hourlyRate: expert.hourly_rate }
}

/**
 * 초빙 수락 — est_hours 입력 → cap 계산 → deal+settlement+workflow 생성
 */
export async function acceptInvitation(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const { expertId, hourlyRate } = await getExpertFromAuth()

  const invitationId = formData.get('invitation_id') as string | null
  const estHoursRaw = formData.get('est_hours') as string | null

  if (!invitationId) {
    return { error: '초빙 정보가 없습니다.' }
  }

  const estHours = estHoursRaw ? parseInt(estHoursRaw, 10) : null
  if (!estHours || estHours < 1 || estHours > 200) {
    return { error: '예상 시간을 1~200 범위로 입력해주세요.' }
  }

  // 초빙 조회 + 소유권 확인
  const { data: invitation } = await adminClient
    .from('invitation')
    .select('id, status, expert_id, owner_id, request_id')
    .eq('id', invitationId)
    .single()

  if (!invitation) {
    return { error: '초빙 정보를 찾을 수 없습니다.' }
  }

  if (invitation.expert_id !== expertId) {
    return { error: '접근 권한이 없습니다.' }
  }

  if (invitation.status !== 'invited') {
    return { error: '이미 처리된 초빙입니다.' }
  }

  // cap 계산
  const rate = hourlyRate ?? 25000
  let cap: ReturnType<typeof calcCapPricing>
  try {
    cap = calcCapPricing(rate, estHours)
  } catch {
    return { error: '최소 작업비(3만원) 미만입니다. 예상 시간을 늘려주세요.' }
  }
  const { estAmount, capAmount, workFee, matchFee, totalPay } = cap

  // 1. invitation 상태 → accepted + 금액 저장
  const { error: invErr } = await adminClient
    .from('invitation')
    .update({
      status: 'accepted',
      est_hours: estHours,
      est_amount: estAmount,
      cap_amount: capAmount,
    })
    .eq('id', invitationId)

  if (invErr) {
    return { error: '초빙 상태 변경에 실패했습니다.' }
  }

  // 2. deal 생성
  const { data: deal, error: dealError } = await adminClient
    .from('deal')
    .insert({
      invitation_id: invitationId,
      request_id: invitation.request_id,
      expert_id: expertId,
      work_fee: workFee,
      match_fee: matchFee,
      total_pay: totalPay,
      status: 'quoted',
    })
    .select('id')
    .single()

  if (dealError || !deal) {
    // 롤백
    await adminClient.from('invitation').update({ status: 'invited', est_hours: null, est_amount: null, cap_amount: null }).eq('id', invitationId)
    return { error: '거래 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  // 3. settlement 생성
  const { error: settlementErr } = await adminClient
    .from('settlement')
    .insert({
      deal_id: deal.id,
      escrow_status: 'pending',
      guarantee_fee: cap.guaranteeFee,
    })

  if (settlementErr) {
    console.error('[acceptInvitation] settlement insert failed:', settlementErr.message)
    // 롤백
    await adminClient.from('deal').delete().eq('id', deal.id)
    await adminClient.from('invitation').update({ status: 'invited', est_hours: null, est_amount: null, cap_amount: null }).eq('id', invitationId)
    return { error: '정산 정보 생성에 실패했습니다.' }
  }

  // 4. deal_workflow 5행 생성
  const steps: WorkflowStep[] = ['intake', 'structure', 'generate', 'verify', 'deliver']
  const { error: workflowErr } = await adminClient
    .from('deal_workflow')
    .insert(steps.map((step) => ({
      deal_id: deal.id,
      step,
      status: 'pending' as const,
    })))

  if (workflowErr) {
    console.error('[acceptInvitation] workflow insert failed:', workflowErr.message)
  }

  // 5. request 상태 업데이트 (request_id가 있는 경우)
  if (invitation.request_id) {
    await adminClient
      .from('request')
      .update({ status: 'dealt' })
      .eq('id', invitation.request_id)
  }

  redirect(`/work/${deal.id}?success=invitation_accepted`)
}

/**
 * 초빙 거절
 */
export async function declineInvitation(invitationId: string): Promise<{ error?: string }> {
  const { expertId } = await getExpertFromAuth()

  const { data: invitation } = await adminClient
    .from('invitation')
    .select('id, status, expert_id')
    .eq('id', invitationId)
    .single()

  if (!invitation || invitation.expert_id !== expertId) {
    return { error: '접근 권한이 없습니다.' }
  }

  if (invitation.status !== 'invited') {
    return { error: '이미 처리된 초빙입니다.' }
  }

  await adminClient
    .from('invitation')
    .update({ status: 'declined' })
    .eq('id', invitationId)

  redirect('/invitations?success=invitation_declined')
}
