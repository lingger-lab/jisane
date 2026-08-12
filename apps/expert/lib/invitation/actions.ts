'use server'

import { redirect } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { resolveExpertFromAuth } from '@jisane/shared/auth/server-helpers'
import { calcCapPricing } from '@jisane/shared/cap-pricing'
import { isFreeModeEnabled } from '@jisane/shared/payment'
import type { WorkflowStep } from '@jisane/shared/types'

async function getExpertFromAuth(): Promise<{ expertId: string; hourlyRate: number | null; name: string }> {
  const { user, expert } = await resolveExpertFromAuth<{
    id: string
    hourly_rate: number | null
    name: string
  }>('id, hourly_rate, name')

  if (!user || !expert) {
    redirect('/')
  }

  return { expertId: expert.id, hourlyRate: expert.hourly_rate, name: expert.name }
}

/**
 * 초빙 수락 — est_hours 입력 → cap 계산 → deal+settlement+workflow 생성
 */
export async function acceptInvitation(
  _prev: { error?: string },
  formData: FormData
): Promise<{ error?: string }> {
  const { expertId, hourlyRate, name: expertName } = await getExpertFromAuth()

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
  let estAmount: number, capAmount: number, workFee: number
  let matchFee: number, totalPay: number, guaranteeFee: number
  if (isFreeModeEnabled()) {
    // 무료 기간(§0): 매칭비 0 — 작업비(cap)만 산출, calcCapPricing의 3만원 throw 스킵.
    estAmount = Math.round(rate * estHours)
    capAmount = estAmount
    workFee = capAmount
    matchFee = 0
    totalPay = workFee
    guaranteeFee = 0
  } else {
    let cap: ReturnType<typeof calcCapPricing>
    try {
      cap = calcCapPricing(rate, estHours)
    } catch {
      return { error: '최소 작업비(3만원) 미만입니다. 예상 시간을 늘려주세요.' }
    }
    ;({ estAmount, capAmount, workFee, matchFee, totalPay } = cap)
    guaranteeFee = cap.guaranteeFee
  }

  // 1. request 확보 — 초빙에 연결된 request가 없으면 생성한다.
  //    deal.request_id가 null이면 owner 소유권 검증·화면 노출·관리자 정산이
  //    전부 request!inner 조인에 걸려 유령 거래가 되므로 반드시 연결한다.
  let requestId = invitation.request_id
  let createdRequestId: string | null = null
  if (!requestId) {
    const { data: newRequest, error: reqInsertErr } = await adminClient
      .from('request')
      .insert({
        owner_id: invitation.owner_id,
        title: `[초빙] ${expertName} 시니어지식인 직접 의뢰`,
        detail: `시니어지식인 초빙으로 시작된 거래입니다. 예상 작업 ${estHours}시간 × 시간당 ${rate.toLocaleString('ko-KR')}원 (캡 ${capAmount.toLocaleString('ko-KR')}원)`,
        req_type: '초빙',
        budget_hope: estAmount,
        status: 'dealt',
      })
      .select('id')
      .single()

    if (reqInsertErr || !newRequest) {
      return { error: '의뢰 정보 생성에 실패했습니다. 다시 시도해주세요.' }
    }
    requestId = newRequest.id
    createdRequestId = newRequest.id
  }

  // 공통 롤백: 생성물 역순 제거 (settlement/workflow는 deal ON DELETE CASCADE)
  async function rollback(dealId?: string) {
    if (dealId) await adminClient.from('deal').delete().eq('id', dealId)
    await adminClient
      .from('invitation')
      .update({ status: 'invited', est_hours: null, est_amount: null, cap_amount: null, request_id: invitation!.request_id })
      .eq('id', invitationId)
    if (createdRequestId) await adminClient.from('request').delete().eq('id', createdRequestId)
  }

  // 2. invitation 상태 → accepted + 금액·request 연결 저장 (compare-and-set: invited일 때만)
  //    동시 수락 시 패자는 0행 매칭 → deal 생성·rollback()에 진입하지 않는다. rollback()이
  //    승자의 invitation을 invited로 되돌리고 금액을 null로 지우던 clobber 경로 차단
  //    (감사 docs/11 P1-8).
  const { data: acceptedInv, error: invErr } = await adminClient
    .from('invitation')
    .update({
      status: 'accepted',
      est_hours: estHours,
      est_amount: estAmount,
      cap_amount: capAmount,
      request_id: requestId,
    })
    .eq('id', invitationId)
    .eq('status', 'invited')
    .select('id')

  if (invErr) {
    if (createdRequestId) await adminClient.from('request').delete().eq('id', createdRequestId)
    return { error: '초빙 상태 변경에 실패했습니다.' }
  }
  if (!acceptedInv || acceptedInv.length === 0) {
    // 경쟁 패배: 이 실행이 새로 만든 request 고아를 정리하고 중단
    if (createdRequestId) await adminClient.from('request').delete().eq('id', createdRequestId)
    return { error: '이미 처리된 초빙입니다.' }
  }

  // 3. deal 생성
  const { data: deal, error: dealError } = await adminClient
    .from('deal')
    .insert({
      invitation_id: invitationId,
      request_id: requestId,
      expert_id: expertId,
      work_fee: workFee,
      match_fee: matchFee,
      total_pay: totalPay,
      status: 'quoted',
    })
    .select('id')
    .single()

  if (dealError || !deal) {
    await rollback()
    return { error: '거래 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  // 4. settlement 생성
  const { error: settlementErr } = await adminClient
    .from('settlement')
    .insert({
      deal_id: deal.id,
      escrow_status: 'pending',
      guarantee_fee: guaranteeFee,
    })

  if (settlementErr) {
    console.error('[acceptInvitation] settlement insert failed:', settlementErr.message)
    await rollback(deal.id)
    return { error: '정산 정보 생성에 실패했습니다.' }
  }

  // 5. deal_workflow 5행 생성 — 실패 시 전체 롤백 (workflow 0행 deal 방지)
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
    await rollback(deal.id)
    return { error: '작업 단계 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  // 6. 기존 request가 연결돼 있던 경우 상태 갱신 (신규 생성분은 이미 dealt)
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

  // compare-and-set: invited일 때만 거절. 수락/거절 동시 실행 시 이미 accepted된
  // 초빙을 declined로 덮어써 live deal이 딸린 초빙이 뒤집히던 경로 차단
  // (감사 docs/11 P1-8 — declineInvitation도 acceptInvitation과 같은 CAS 부재였음).
  const { data: declined } = await adminClient
    .from('invitation')
    .update({ status: 'declined' })
    .eq('id', invitationId)
    .eq('status', 'invited')
    .select('id')

  if (!declined || declined.length === 0) {
    return { error: '이미 처리된 초빙입니다.' }
  }

  redirect('/invitations?success=invitation_declined')
}
