import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import { calcMatchFee } from '@/lib/pricing'
import type { WorkflowStep } from '@/lib/types'

export async function GET(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  const { data: matching, error } = await adminClient
    .from('matching')
    .select('id, status, created_at, request:request!inner(id, title, detail, req_type, scope, budget_hope)')
    .eq('id', id)
    .eq('partner_id', partner.id)
    .single()

  if (error || !matching) {
    return NextResponse.json({ error: 'Matching not found' }, { status: 404 })
  }

  return NextResponse.json({ matching })
}

export async function PATCH(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner) {
    return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
  }

  const { data: matching } = await adminClient
    .from('matching')
    .select('id, status, request_id, partner_id')
    .eq('id', id)
    .single()

  if (!matching || matching.partner_id !== partner.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (matching.status !== 'proposed') {
    return NextResponse.json({ error: 'Already processed' }, { status: 400 })
  }

  const body = await request.json()
  const { status } = body

  if (status !== 'accepted' && status !== 'rejected') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  // Update matching status
  await adminClient
    .from('matching')
    .update({ status })
    .eq('id', id)

  if (status === 'rejected') {
    return NextResponse.json({ success: true })
  }

  // accepted → create deal + workflow
  const { data: req } = await adminClient
    .from('request')
    .select('id, budget_hope, scope')
    .eq('id', matching.request_id)
    .single()

  const workFee = req?.budget_hope || 100000
  let matchFee: number
  try {
    matchFee = calcMatchFee(workFee)
  } catch {
    return NextResponse.json({ error: 'Work fee too low' }, { status: 400 })
  }

  const { data: deal, error: dealError } = await adminClient
    .from('deal')
    .insert({
      matching_id: id,
      request_id: matching.request_id,
      partner_id: partner.id,
      work_fee: workFee,
      match_fee: matchFee,
      total_pay: workFee + matchFee,
      scope: req?.scope,
      status: 'quoted',
    })
    .select('id')
    .single()

  if (dealError || !deal) {
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 })
  }

  // settlement
  await adminClient.from('settlement').insert({
    deal_id: deal.id,
    escrow_status: 'pending',
    guarantee_fee: 0,
  })

  // workflow 5 steps
  const steps: WorkflowStep[] = ['intake', 'structure', 'generate', 'verify', 'deliver']
  await adminClient.from('deal_workflow').insert(
    steps.map((step) => ({ deal_id: deal.id, step, status: 'pending' as const }))
  )

  // request → dealt
  await adminClient
    .from('request')
    .update({ status: 'dealt' })
    .eq('id', matching.request_id)

  return NextResponse.json({ success: true, deal_id: deal.id })
}
