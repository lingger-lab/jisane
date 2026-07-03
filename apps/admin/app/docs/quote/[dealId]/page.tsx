import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { PrintButton } from '@jisane/ui/print-button'

export default async function QuotePage(props: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await props.params

  // 인증 확인
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // deal + request + client 정보 조회
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, work_fee, match_fee, total_pay, scope, due_date, status, created_at, request_id, partner_id')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return <div className="p-10 text-center text-text-muted">견적서를 찾을 수 없습니다.</div>
  }

  // 소유권 확인 (client 또는 admin)
  const { data: client } = await adminClient
    .from('client')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  const isAdmin = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase()).includes((user.email || '').toLowerCase())

  if (!isAdmin) {
    if (!client) redirect('/')
    // client인 경우 request 소유 확인
    if (deal.request_id) {
      const { data: request } = await adminClient
        .from('request')
        .select('client_id')
        .eq('id', deal.request_id)
        .single()
      if (!request || request.client_id !== client.id) redirect('/')
    }
  }

  // request 정보
  let requestTitle = ''
  let requestDetail = ''
  if (deal.request_id) {
    const { data: request } = await adminClient
      .from('request')
      .select('title, detail')
      .eq('id', deal.request_id)
      .single()
    if (request) {
      requestTitle = request.title
      requestDetail = request.detail
    }
  }

  // partner 정보
  let partnerName = '미지정'
  if (deal.partner_id) {
    const { data: partner } = await adminClient
      .from('partner')
      .select('name, field')
      .eq('id', deal.partner_id)
      .single()
    if (partner) {
      partnerName = partner.name || '파트너'
    }
  }

  const issueDate = new Date(deal.created_at).toLocaleDateString('ko-KR')
  const vat = Math.round(deal.total_pay * 0.1)

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 print:max-w-none print:px-0 print:py-0">
      {/* 인쇄 버튼 (화면에서만 보임) */}
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* 견적서 본문 */}
      <div className="border border-border p-8 print:border-none print:p-10">
        {/* 제목 */}
        <h1 className="mb-8 text-center text-2xl font-bold tracking-widest">견 적 서</h1>

        {/* 발행 정보 */}
        <div className="mb-6 flex justify-between text-sm">
          <div>
            <p><span className="font-medium">견적번호:</span> Q-{deal.id.slice(0, 8).toUpperCase()}</p>
            <p><span className="font-medium">발행일:</span> {issueDate}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">지사네 (jisane)</p>
            <p className="text-xs text-text-muted">부울경 로컬 인력매칭 플랫폼</p>
          </div>
        </div>

        <hr className="mb-6 border-border" />

        {/* 의뢰 정보 */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-bold text-text">의뢰 정보</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border-light">
                <td className="w-28 py-2 font-medium text-text-muted">의뢰 제목</td>
                <td className="py-2">{requestTitle || '-'}</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 font-medium text-text-muted">의뢰 내용</td>
                <td className="py-2 whitespace-pre-wrap">{requestDetail || '-'}</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 font-medium text-text-muted">담당 파트너</td>
                <td className="py-2">{partnerName}</td>
              </tr>
              {deal.scope && (
                <tr className="border-b border-border-light">
                  <td className="py-2 font-medium text-text-muted">작업 범위</td>
                  <td className="py-2">{deal.scope}</td>
                </tr>
              )}
              {deal.due_date && (
                <tr className="border-b border-border-light">
                  <td className="py-2 font-medium text-text-muted">납기일</td>
                  <td className="py-2">{new Date(deal.due_date).toLocaleDateString('ko-KR')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 금액 */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-bold text-text">견적 금액</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-surface">
                <th className="py-2 text-left font-medium">항목</th>
                <th className="py-2 text-right font-medium">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-light">
                <td className="py-2">작업료</td>
                <td className="py-2 text-right">{deal.work_fee.toLocaleString('ko-KR')}원</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2">매칭비 (지사네 수수료)</td>
                <td className="py-2 text-right">{deal.match_fee.toLocaleString('ko-KR')}원</td>
              </tr>
              <tr className="border-b border-border bg-surface font-bold">
                <td className="py-2">합계 (VAT 별도)</td>
                <td className="py-2 text-right">{deal.total_pay.toLocaleString('ko-KR')}원</td>
              </tr>
              <tr className="border-b border-border-light text-text-muted">
                <td className="py-2">부가세 (10%)</td>
                <td className="py-2 text-right">{vat.toLocaleString('ko-KR')}원</td>
              </tr>
              <tr className="font-bold text-lg">
                <td className="py-3">총 결제 예정액</td>
                <td className="py-3 text-right">{(deal.total_pay + vat).toLocaleString('ko-KR')}원</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 안내 */}
        <div className="rounded-lg bg-surface p-4 text-xs text-text-muted">
          <p className="mb-1">본 견적서는 지사네 플랫폼을 통해 자동 생성되었습니다.</p>
          <p className="mb-1">작업료는 에스크로 방식으로 안전하게 보관됩니다.</p>
          <p className="mb-1">시니어 작업료 수수료 0% — 작업료 전액이 시니어에게 지급됩니다.</p>
          <p>매칭비는 지사네 플랫폼 중개 수수료입니다.</p>
        </div>
      </div>
    </div>
  )
}
