'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { calcMatchFee } from '@/lib/pricing'
import type { WorkflowStep } from '@/lib/types'

async function getPartnerIdFromAuth(): Promise<{ partnerId: string; authUserId: string }> {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) {
    redirect('/')
  }

  return { partnerId: partner.id, authUserId: user.id }
}

export async function acceptMatching(matchingId: string): Promise<{ error?: string }> {
  const { partnerId } = await getPartnerIdFromAuth()

  // 매칭 조회 + 소유권 확인
  const { data: matching } = await adminClient
    .from('matching')
    .select('id, status, request_id, partner_id')
    .eq('id', matchingId)
    .single()

  if (!matching) {
    return { error: '매칭 정보를 찾을 수 없습니다.' }
  }

  if (matching.partner_id !== partnerId) {
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
  await adminClient
    .from('matching')
    .update({ status: 'accepted' })
    .eq('id', matchingId)

  // 2. deal 생성
  const { data: deal, error: dealError } = await adminClient
    .from('deal')
    .insert({
      matching_id: matchingId,
      request_id: matching.request_id,
      partner_id: partnerId,
      work_fee: workFee,
      match_fee: matchFee,
      total_pay: totalPay,
      scope: request.scope,
      status: 'quoted',
    })
    .select('id')
    .single()

  if (dealError || !deal) {
    return { error: '거래 생성에 실패했습니다.' }
  }

  // 3. settlement 생성
  await adminClient
    .from('settlement')
    .insert({
      deal_id: deal.id,
      escrow_status: 'pending',
      guarantee_fee: 0,
    })

  // 4. deal_workflow 5행 생성
  const steps: WorkflowStep[] = ['intake', 'structure', 'generate', 'verify', 'deliver']
  await adminClient
    .from('deal_workflow')
    .insert(steps.map((step) => ({
      deal_id: deal.id,
      step,
      status: 'pending' as const,
    })))

  // 5. request.status → 'dealt'
  await adminClient
    .from('request')
    .update({ status: 'dealt' })
    .eq('id', matching.request_id)

  redirect(`/work/${deal.id}`)
}

export async function rejectMatching(matchingId: string): Promise<{ error?: string }> {
  const { partnerId } = await getPartnerIdFromAuth()

  const { data: matching } = await adminClient
    .from('matching')
    .select('id, status, partner_id')
    .eq('id', matchingId)
    .single()

  if (!matching || matching.partner_id !== partnerId) {
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
