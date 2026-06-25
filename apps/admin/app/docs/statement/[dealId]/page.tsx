import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@jisane/shared/supabase/server'
import { adminClient } from '@jisane/shared/supabase/admin'
import { PrintButton } from '@jisane/ui/print-button'

export default async function StatementPage(props: { params: Promise<{ dealId: string }> }) {
  const { dealId } = await props.params

  // 인증 확인
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // deal + settlement 조회
  const { data: deal } = await adminClient
    .from('deal')
    .select('id, work_fee, match_fee, total_pay, scope, due_date, status, created_at, request_id, partner_id')
    .eq('id', dealId)
    .single()

  if (!deal) {
    return <div className="p-10 text-center text-text-muted">거래명세서를 찾을 수 없습니다.</div>
  }

  // 소유권 확인 (client, partner 또는 admin)
  const [clientRes, partnerRes] = await Promise.all([
    adminClient.from('client').select('id').eq('auth_user_id', user.id).single(),
    adminClient.from('partner').select('id').eq('auth_user_id', user.id).single(),
  ])

  const isAdmin = (process.env.ADMIN_EMAILS || '').split(',').includes(user.email || '')
  const isClient = !!clientRes.data
  const isPartner = partnerRes.data?.id === deal.partner_id

  if (!isAdmin && !isPartner) {
    // client 소유 확인
    if (!isClient || !deal.request_id) redirect('/')
    const { data: request } = await adminClient
      .from('request')
      .select('client_id')
      .eq('id', deal.request_id)
      .single()
    if (!request || request.client_id !== clientRes.data!.id) redirect('/')
  }

  // settlement 정보
  const { data: settlement } = await adminClient
    .from('settlement')
    .select('escrow_status, deposited_at, released_at, refunded_amt, refund_reason')
    .eq('deal_id', dealId)
    .single()

  // request 정보
  let requestTitle = ''
  if (deal.request_id) {
    const { data: request } = await adminClient
      .from('request')
      .select('title')
      .eq('id', deal.request_id)
      .single()
    if (request) requestTitle = request.title
  }

  // partner 정보
  let partnerName = '미지정'
  let partnerField = ''
  if (deal.partner_id) {
    const { data: partner } = await adminClient
      .from('partner')
      .select('name, field')
      .eq('id', deal.partner_id)
      .single()
    if (partner) {
      partnerName = partner.name || '파트너'
      partnerField = partner.field || ''
    }
  }

  const statusLabels: Record<string, string> = {
    quoted: '견적 완료',
    working: '작업 중',
    done: '완료',
  }

  const escrowLabels: Record<string, string> = {
    pending: '대기',
    deposited: '입금 완료',
    reviewing: '검수 중',
    released: '정산 완료',
    refunded: '환불 처리',
  }

  const issueDate = new Date().toLocaleDateString('ko-KR')
  const dealDate = new Date(deal.created_at).toLocaleDateString('ko-KR')
  const vat = Math.round(deal.total_pay * 0.1)

  return (
    <div className="mx-auto max-w-2xl px-8 py-10 print:max-w-none print:px-0 print:py-0">
      {/* 인쇄 버튼 */}
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      {/* 거래명세서 본문 */}
      <div className="border border-border p-8 print:border-none print:p-10">
        <h1 className="mb-8 text-center text-2xl font-bold tracking-widest">거 래 명 세 서</h1>

        {/* 발행 정보 */}
        <div className="mb-6 flex justify-between text-sm">
          <div>
            <p><span className="font-medium">문서번호:</span> S-{deal.id.slice(0, 8).toUpperCase()}</p>
            <p><span className="font-medium">발행일:</span> {issueDate}</p>
            <p><span className="font-medium">거래일:</span> {dealDate}</p>
          </div>
          <div className="text-right">
            <p className="font-medium">지사네 (jisane)</p>
            <p className="text-xs text-text-muted">부울경 로컬 인력매칭 플랫폼</p>
          </div>
        </div>

        <hr className="mb-6 border-border" />

        {/* 거래 정보 */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-bold text-text">거래 정보</h2>
          <table className="w-full text-sm">
            <tbody>
              <tr className="border-b border-border-light">
                <td className="w-28 py-2 font-medium text-text-muted">의뢰 제목</td>
                <td className="py-2">{requestTitle || '-'}</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 font-medium text-text-muted">담당 파트너</td>
                <td className="py-2">{partnerName}{partnerField ? ` (${partnerField})` : ''}</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2 font-medium text-text-muted">거래 상태</td>
                <td className="py-2">{statusLabels[deal.status] || deal.status}</td>
              </tr>
              {settlement && (
                <tr className="border-b border-border-light">
                  <td className="py-2 font-medium text-text-muted">정산 상태</td>
                  <td className="py-2">{escrowLabels[settlement.escrow_status] || settlement.escrow_status}</td>
                </tr>
              )}
              {settlement?.deposited_at && (
                <tr className="border-b border-border-light">
                  <td className="py-2 font-medium text-text-muted">입금일</td>
                  <td className="py-2">{new Date(settlement.deposited_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              )}
              {settlement?.released_at && (
                <tr className="border-b border-border-light">
                  <td className="py-2 font-medium text-text-muted">정산일</td>
                  <td className="py-2">{new Date(settlement.released_at).toLocaleDateString('ko-KR')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 금액 명세 */}
        <div className="mb-6">
          <h2 className="mb-2 text-sm font-bold text-text">금액 명세</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-border bg-surface">
                <th className="py-2 text-left font-medium">항목</th>
                <th className="py-2 text-center font-medium">비고</th>
                <th className="py-2 text-right font-medium">금액</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border-light">
                <td className="py-2">작업료</td>
                <td className="py-2 text-center text-xs text-text-muted">파트너 지급액</td>
                <td className="py-2 text-right">{deal.work_fee.toLocaleString('ko-KR')}원</td>
              </tr>
              <tr className="border-b border-border-light">
                <td className="py-2">매칭비</td>
                <td className="py-2 text-center text-xs text-text-muted">지사네 중개 수수료</td>
                <td className="py-2 text-right">{deal.match_fee.toLocaleString('ko-KR')}원</td>
              </tr>
              <tr className="border-b border-border bg-surface font-bold">
                <td className="py-2">소계 (VAT 별도)</td>
                <td className="py-2"></td>
                <td className="py-2 text-right">{deal.total_pay.toLocaleString('ko-KR')}원</td>
              </tr>
              <tr className="border-b border-border-light text-text-muted">
                <td className="py-2">부가세 (10%)</td>
                <td className="py-2"></td>
                <td className="py-2 text-right">{vat.toLocaleString('ko-KR')}원</td>
              </tr>
              <tr className="font-bold text-lg">
                <td className="py-3">총액</td>
                <td className="py-3"></td>
                <td className="py-3 text-right">{(deal.total_pay + vat).toLocaleString('ko-KR')}원</td>
              </tr>
              {settlement && settlement.refunded_amt > 0 && (
                <tr className="border-t border-border text-error">
                  <td className="py-2">환불액</td>
                  <td className="py-2 text-center text-xs">{settlement.refund_reason || '-'}</td>
                  <td className="py-2 text-right">-{settlement.refunded_amt.toLocaleString('ko-KR')}원</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 안내 */}
        <div className="rounded-lg bg-surface p-4 text-xs text-text-muted">
          <p className="mb-1">본 거래명세서는 지사네 플랫폼을 통해 자동 생성되었습니다.</p>
          <p className="mb-1">작업료는 에스크로(안전결제) 방식으로 처리됩니다.</p>
          <p>문의: 지사네 매니저 (카카오 채널)</p>
        </div>
      </div>
    </div>
  )
}
