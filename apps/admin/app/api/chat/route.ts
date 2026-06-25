import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { matchFaq } from '@/lib/chat/faq-matcher'
import { determineEscalation } from '@/lib/chat/escalation'

const ALLOWED_ORIGINS = [
  'https://partner.jisane.cloud',
  'https://owner.jisane.cloud',
  'https://jisane.cloud',
]

function getCorsHeaders(request: Request) {
  const origin = request.headers.get('origin') || ''
  const allowed = ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== 'production'
  return {
    'Access-Control-Allow-Origin': allowed ? origin : '',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

export async function OPTIONS(request: Request) {
  return NextResponse.json(null, { headers: getCorsHeaders(request) })
}

/**
 * POST /api/chat — FAQ 정적 챗봇 (TRD §6 인터페이스 호환)
 * 비로그인 사용자도 FAQ 응답 가능, inquiry 생성은 로그인 시만
 */
export async function POST(request: Request) {
  const cors = getCorsHeaders(request)
  const body = await request.json()
  const { question } = body

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json({ error: 'question is required' }, { status: 400, headers: cors })
  }

  if (question.trim().length > 500) {
    return NextResponse.json({ error: '질문은 500자 이내로 입력해주세요.' }, { status: 400, headers: cors })
  }

  // FAQ 매칭 시도
  const { faq } = matchFaq(question)

  if (faq) {
    return NextResponse.json({
      answer: faq.answer,
      escalated: false,
      escalate_to: null,
      category: 'FAQ',
    }, { headers: cors })
  }

  // 매칭 실패 → 에스컬레이션
  const { escalateTo, category } = determineEscalation(question)

  // 로그인 사용자인 경우 inquiry 생성
  let inquiryId: string | null = null
  try {
    const cookieStore = await cookies()
    const supabase = createClient(cookieStore)
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // author_type 판별 (partner or client)
      const { data: partner } = await adminClient
        .from('partner')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      const { data: client } = await adminClient
        .from('client')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      const authorId = partner?.id || client?.id || null
      const authorType = partner ? 'partner' : client ? 'client' : null

      if (authorId && authorType) {
        const { data: inquiry } = await adminClient
          .from('inquiry')
          .insert({
            author_id: authorId,
            author_type: authorType,
            category,
            content: question,
            status: 'open',
          })
          .select('id')
          .single()

        inquiryId = inquiry?.id || null
      }
    }
  } catch {
    // 비로그인 또는 인증 실패 — inquiry 생성 스킵
  }

  return NextResponse.json({
    answer:
      '해당 질문은 지사네 매니저가 직접 답변드리겠습니다. 카카오톡 채널로 연결하시면 더 빠르게 도움 받으실 수 있습니다.',
    escalated: true,
    escalate_to: escalateTo,
    category,
    inquiry_id: inquiryId,
  }, { headers: cors })
}
