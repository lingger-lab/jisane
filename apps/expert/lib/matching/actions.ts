'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { calcMatchFee, calcGuaranteeFee } from '@jisane/shared/pricing'
import type { WorkflowStep } from '@jisane/shared/types'

async function getExpertIdFromAuth(): Promise<{ expertId: string; authUserId: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: expert } = await adminClient
    .from('expert')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!expert) {
    redirect('/')
  }

  return { expertId: expert.id, authUserId: user.id }
}

export async function acceptMatching(matchingId: string): Promise<{ error?: string }> {
  const { expertId } = await getExpertIdFromAuth()

  // 매칭 조회 + 소유권 확인
  const { data: matching } = await adminClient
    .from('matching')
    .select('id, status, request_id, expert_id')
    .eq('id', matchingId)
    .single()

  if (!matching) {
    return { error: '매칭 정보를 찾을 수 없습니다.' }
  }

  if (matching.expert_id !== expertId) {
    return { error: '접근 권한이 없습니다.' }
  }

  if (matching.status !== 'proposed') {
    return { error: '이미 처리된 매칭입니다.' }
  }

  // 의뢰 정보에서 budget_hope로 work_fee 결정
  const { data: request } = await adminClient
    .from('request')
    .select('id, budget_hope, scope')
    .eq('id', matching.request_id)
    .single()

  if (!request) {
    return { error: '의뢰 정보를 찾을 수 없습니다.' }
  }

  // work_fee: budget_hope 기반 (없으면 기본값 100,000)
  const workFee = request.budget_hope || 100000
  let matchFee: number
  try {
    matchFee = calcMatchFee(workFee)
  } catch {
    return { error: '최소 작업비(3만원) 미만의 의뢰입니다.' }
  }
  const totalPay = workFee + matchFee

  // 1. matching.status → 'accepted'
  const { error: matchErr } = await adminClient
    .from('matching')
    .update({ status: 'accepted' })
    .eq('id', matchingId)

  if (matchErr) {
    return { error: '매칭 상태 변경에 실패했습니다.' }
  }

  // 2. deal 생성
  const { data: deal, error: dealError } = await adminClient
    .from('deal')
    .insert({
      matching_id: matchingId,
      request_id: matching.request_id,
      expert_id: expertId,
      work_fee: workFee,
      match_fee: matchFee,
      total_pay: totalPay,
      scope: request.scope,
      status: 'quoted',
    })
    .select('id')
    .single()

  if (dealError || !deal) {
    // 롤백: matching을 다시 proposed로 되돌림
    await adminClient.from('matching').update({ status: 'proposed' }).eq('id', matchingId)
    return { error: '거래 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  // 3. settlement 생성
  const { error: settlementErr } = await adminClient
    .from('settlement')
    .insert({
      deal_id: deal.id,
      escrow_status: 'pending',
      guarantee_fee: calcGuaranteeFee(matchFee),
    })

  if (settlementErr) {
    console.error('[acceptMatching] settlement insert failed:', settlementErr.message)
    // 롤백: deal 삭제 + matching을 proposed로 되돌림
    await adminClient.from('deal').delete().eq('id', deal.id)
    await adminClient.from('matching').update({ status: 'proposed' }).eq('id', matchingId)
    return { error: '정산 정보 생성에 실패했습니다. 다시 시도해주세요.' }
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
    console.error('[acceptMatching] workflow insert failed:', workflowErr.message)
  }

  // 5. request.status → 'dealt'
  const { error: reqErr } = await adminClient
    .from('request')
    .update({ status: 'dealt' })
    .eq('id', matching.request_id)

  if (reqErr) {
    console.error('[acceptMatching] request status update failed:', reqErr.message)
  }

  redirect(`/work/${deal.id}`)
}

export async function rejectMatching(matchingId: string): Promise<{ error?: string }> {
  const { expertId } = await getExpertIdFromAuth()

  const { data: matching } = await adminClient
    .from('matching')
    .select('id, status, expert_id')
    .eq('id', matchingId)
    .single()

  if (!matching || matching.expert_id !== expertId) {
    return { error: '접근 권한이 없습니다.' }
  }

  if (matching.status !== 'proposed') {
    return { error: '이미 처리된 매칭입니다.' }
  }

  await adminClient
    .from('matching')
    .update({ status: 'rejected' })
    .eq('id', matchingId)

  redirect('/matching')
}
