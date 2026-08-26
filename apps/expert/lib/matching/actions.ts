'use server'

import { redirect } from 'next/navigation'
import { adminClient } from '@jisane/shared/supabase/admin'
import { resolveExpertFromAuth, requireActiveExpert } from '@jisane/shared/auth/server-helpers'
import { calcMatchFee, calcGuaranteeFee } from '@jisane/shared/pricing'
import { isFreeModeEnabled } from '@jisane/shared/payment'
import type { WorkflowStep } from '@jisane/shared/types'

async function getExpertIdFromAuth(): Promise<{ expertId: string; authUserId: string }> {
  const { user, expert } = await resolveExpertFromAuth()

  if (!user || !expert) {
    redirect('/')
  }

  return { expertId: expert.id, authUserId: user.id }
}

export async function acceptMatching(matchingId: string): Promise<{ error?: string }> {
  // 활성 계정만 매칭 수락 가능(탈퇴·중지·대기 차단 — 감사 P1-1).
  const guard = await requireActiveExpert()
  if (!guard.ok) return { error: guard.error }
  const expertId = guard.expertId

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
  // 무료 기간(§0): 매칭비 0 — calcMatchFee(및 3만원 하한 throw) 스킵, 작업비만 부과.
  let matchFee: number
  if (isFreeModeEnabled()) {
    matchFee = 0
  } else {
    try {
      matchFee = calcMatchFee(workFee)
    } catch {
      return { error: '최소 작업비(3만원) 미만의 의뢰입니다.' }
    }
  }
  const totalPay = workFee + matchFee

  // 1. matching.status → 'accepted' (compare-and-set: proposed일 때만)
  //    동시 수락(이중 클릭·두 탭) 시 패자는 0행 매칭 → 아래에서 중단하여 deal 생성·롤백에
  //    진입하지 않는다. 롤백이 승자의 accepted를 proposed로 되돌려 깨뜨리던 경로 차단
  //    (감사 docs/11 P1-7). deal.matching_id UNIQUE는 이중 deal은 막지만 이 clobber는 못 막음.
  const { data: acceptedMatch, error: matchErr } = await adminClient
    .from('matching')
    .update({ status: 'accepted' })
    .eq('id', matchingId)
    .eq('status', 'proposed')
    .select('id')

  if (matchErr) {
    return { error: '매칭 상태 변경에 실패했습니다.' }
  }
  if (!acceptedMatch || acceptedMatch.length === 0) {
    return { error: '이미 처리된 매칭입니다.' }
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
    // 롤백: deal 삭제(settlement/workflow는 ON DELETE CASCADE) + matching을 proposed로 되돌림
    await adminClient.from('deal').delete().eq('id', deal.id)
    await adminClient.from('matching').update({ status: 'proposed' }).eq('id', matchingId)
    return { error: '작업 단계 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  // 5. request.status → 'dealt'
  const { error: reqErr } = await adminClient
    .from('request')
    .update({ status: 'dealt' })
    .eq('id', matching.request_id)

  if (reqErr) {
    console.error('[acceptMatching] request status update failed:', reqErr.message)
    // 방치 시 재매칭 이중예약 가능 — 전체 롤백
    await adminClient.from('deal').delete().eq('id', deal.id)
    await adminClient.from('matching').update({ status: 'proposed' }).eq('id', matchingId)
    return { error: '의뢰 상태 변경에 실패했습니다. 다시 시도해주세요.' }
  }

  redirect(`/work/${deal.id}`)
}

export async function rejectMatching(matchingId: string): Promise<{ error?: string }> {
  const { expertId } = await getExpertIdFromAuth()

  const { data: matching } = await adminClient
    .from('matching')
    .select('id, status, expert_id, request_id')
    .eq('id', matchingId)
    .single()

  if (!matching || matching.expert_id !== expertId) {
    return { error: '접근 권한이 없습니다.' }
  }

  if (matching.status !== 'proposed') {
    return { error: '이미 처리된 매칭입니다.' }
  }

  // compare-and-set: proposed일 때만 거절. 수락/거절 동시 실행 시 이미 accepted된
  // 매칭을 rejected로 덮어써 live deal이 딸린 매칭이 rejected로 뒤집히던 경로 차단
  // (감사 docs/11 P1-7 — rejectMatching도 acceptMatching과 같은 CAS 부재였음).
  const { data: rejected } = await adminClient
    .from('matching')
    .update({ status: 'rejected' })
    .eq('id', matchingId)
    .eq('status', 'proposed')
    .select('id')

  if (!rejected || rejected.length === 0) {
    return { error: '이미 처리된 매칭입니다.' }
  }

  // 거절된 의뢰를 open으로 복귀 — 관리자 재매칭 액션은 open만 받으므로
  // 복귀하지 않으면 의뢰가 matching 상태로 영구 고착된다 (dealt로 넘어간 경우는 제외)
  await adminClient
    .from('request')
    .update({ status: 'open' })
    .eq('id', matching.request_id)
    .eq('status', 'matching')

  redirect('/matching')
}
