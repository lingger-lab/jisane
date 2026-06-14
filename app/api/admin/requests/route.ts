import { NextResponse } from 'next/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const adminSecret = request.headers.get('x-admin-secret')
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') || 'open'

  const { data, error } = await adminClient
    .from('request')
    .select('id, title, detail, req_type, scope, budget_hope, status, created_at, client_id')
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests: data })
}
