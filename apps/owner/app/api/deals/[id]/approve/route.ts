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

  // deal + request + owner 소유권 확인
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
      .select('owner_id')
      .eq('id', deal.request_id)
      .single()

    if (request) {
      const { data: ownerRow } = await adminClient
        .from('owner')
        .select('auth_user_id')
        .eq('id', request.owner_id)
        .single()

      if (!ownerRow || ownerRow.auth_user_id !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }
  }

  if (deal.status !== 'quoted') {
    return NextResponse.json({ error: 'Deal is not in quoted status' }, { status: 400 })
  }

  const { error } = await adminClient
    .from('deal')
    .update({ status: 'working' })
    .eq('id', dealId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
