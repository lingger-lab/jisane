'use client'

import { useState } from 'react'
import { releaseSettlement } from '@/lib/admin/actions'

interface SettlementItem {
  id: string
  deal_id: string
  escrow_status: string
  guarantee_fee: number
  deposited_at: string | null
  deal: {
    id: string
    work_fee: number
    match_fee: number
    total_pay: number
    request: { id: string; title: string }
    partner: { id: string; name: string | null }
  }
}

interface LedgerEntry {
  id: string
  entry_type: string
  amount: number
  note: string | null
  created_at: string
}

export function SettlementTab({
  settlements,
  ledgerEntries,
  fundBalance,
}: {
  settlements: SettlementItem[]
  ledgerEntries: LedgerEntry[]
  fundBalance: number
}) {
  const [releasing, setReleasing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleRelease(settlementId: string) {
    if (!confirm('정산을 실행하시겠습니까? 에스크로가 해제되고 파트너에게 지급됩니다.')) return

    setReleasing(settlementId)
    setError(null)
    const result = await releaseSettlement(settlementId)
    if (result.error) {
      setError(result.error)
    }
    setReleasing(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 적립금 잔액 */}
      <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-text-muted">지사네 책임 적립금</p>
            <p className="mt-1 text-xl font-bold text-accent">
              {fundBalance.toLocaleString('ko-KR')}
              <span className="text-sm font-normal">원</span>
            </p>
          </div>
        </div>
        {ledgerEntries.length > 0 && (
          <div className="mt-3 border-t border-accent/20 pt-3">
            <p className="mb-2 text-xs font-medium text-text-muted">최근 원장</p>
            {ledgerEntries.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-1 text-xs">
                <span className="text-text-muted">
                  {entry.entry_type === 'accrue' ? '적립' : '사용'} · {entry.note}
                </span>
                <span className={entry.entry_type === 'accrue' ? 'text-green-600' : 'text-red-600'}>
                  {entry.entry_type === 'accrue' ? '+' : '-'}
                  {entry.amount.toLocaleString('ko-KR')}원
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 정산 대기 목록 */}
      {error && <p className="text-xs text-accent">{error}</p>}

      {settlements.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-muted">정산 대기 중인 건이 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {settlements.map((s) => (
            <div key={s.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-text">{s.deal.request.title}</h3>
                  <p className="mt-1 text-xs text-text-muted">
                    파트너: {s.deal.partner.name || '미등록'}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  s.escrow_status === 'deposited'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {s.escrow_status === 'deposited' ? '입금 완료' : '검수 중'}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <p className="text-text-muted">작업비</p>
                  <p className="font-medium">{s.deal.work_fee.toLocaleString('ko-KR')}원</p>
                </div>
                <div>
                  <p className="text-text-muted">매칭피</p>
                  <p className="font-medium">{s.deal.match_fee.toLocaleString('ko-KR')}원</p>
                </div>
                <div>
                  <p className="text-text-muted">적립금</p>
                  <p className="font-medium">{s.guarantee_fee.toLocaleString('ko-KR')}원</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleRelease(s.id)}
                disabled={releasing === s.id}
                className="mt-3 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {releasing === s.id ? '처리 중...' : '정산 실행'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
