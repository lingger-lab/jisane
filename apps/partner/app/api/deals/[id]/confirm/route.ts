import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function PATCH(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await props.params

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 소유권 확인
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, status, request_id')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
  }

  if (deal.request_id) {
    const { data: request } = await adminClient
      .from('request')
      .select('client_id')
      .eq('id', deal.request_id)
      .single()

    if (request) {
      const { data: client } = await adminClient
        .from('client')
        .select('auth_user_id')
        .eq('id', request.client_id)
        .single()

      if (!client || client.auth_user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  if (deal.status !== 'working') {
    return NextResponse.json({ error: 'Deal is not in working status' }, { status: 400 })
  }

  // deal → done
  const { error: dealError } = await adminClient
    .from('deal')
    .update({ status: 'done' })
    .eq('id', dealId)

  if (dealError) {
    return NextResponse.json({ error: dealError.message }, { status: 500 })
  }

  // settlement → reviewing
  await adminClient
    .from('settlement')
    .update({ escrow_status: 'reviewing' })
    .eq('deal_id', dealId)

  return NextResponse.json({ success: true })
}
