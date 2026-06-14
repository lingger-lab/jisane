import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'
import type { WorkflowStep } from '@/lib/types'

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
    .select('id, partner_id')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  const { data: partner } = await adminClient
    .from('partner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!partner || deal.partner_id !== partner.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { status: newStatus, note } = body

  if (newStatus !== 'pending' && newStatus !== 'in_progress' && newStatus !== 'done') {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
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
