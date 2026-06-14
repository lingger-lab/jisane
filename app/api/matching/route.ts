import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { adminClient } from '@/lib/supabase/admin'

export async function GET() {
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

  const { data: matchings, error } = await adminClient
    .from('matching')
    .select('id, status, created_at, request:request!inner(id, title, req_type, budget_hope, detail)')
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ matchings })
}
