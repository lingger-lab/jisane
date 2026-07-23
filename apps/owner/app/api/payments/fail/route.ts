import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { adminClient } from '@jisane/shared/supabase/admin'

/**
 * Toss 결제 실패 리다이렉트 종단
 * GET /api/payments/fail?dealId=...&code=...&message=...
 * 의뢰 상태 페이지로 돌려보낸다. (자금 이동 없음 — 상태 변경하지 않음)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const dealId = searchParams.get('dealId')
  const code = searchParams.get('code')

  if (code) {
    console.warn(`[payments/fail] dealId=${dealId} code=${code}`)
  }

  if (dealId) {
    const { data: deal } = await adminClient
      .from('deal')
      .select('request_id')
      .eq('id', dealId)
      .single()

    if (deal?.request_id) {
      return NextResponse.redirect(
        new URL(`/status/${deal.request_id}?error=payment_failed`, request.url)
      )
    }
  }

  return NextResponse.redirect(new URL('/?error=payment_failed', request.url))
}
