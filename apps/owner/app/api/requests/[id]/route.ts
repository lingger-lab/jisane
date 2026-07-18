import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'

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

  const { data: ownerRow } = await adminClient
    .from('owner')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!ownerRow) {
    return NextResponse.json({ error: 'Owner not found' }, { status: 404 })
  }

  // request + deal 조인
  const { data: request, error } = await adminClient
    .from('request')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerRow.id)
    .single()

  if (error || !request) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  }

  // 관련 deal 조회
  const { data: deals } = await adminClient
    .from('deal')
    .select('id, status, work_fee, match_fee, total_pay, scope, due_date, created_at')
    .eq('request_id', id)

  return NextResponse.json({ request, deals: deals || [] })
}
