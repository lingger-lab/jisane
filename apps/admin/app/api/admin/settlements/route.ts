import { NextResponse } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'

export async function GET(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await adminClient
    .from('settlement')
    .select(`
      id, deal_id, escrow_status, guarantee_fee, payment_key, deposited_at, released_at, created_at,
      deal:deal!inner(
        id, work_fee, match_fee, total_pay, status,
        request:request!inner(id, title),
        expert:expert!inner(id, name)
      )
    `)
    .in('escrow_status', ['deposited', 'reviewing'])
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ settlements: data })
}
