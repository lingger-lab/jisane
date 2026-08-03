'use client'

import { useState } from 'react'
import { updateProviderStatus, updatePackageStatus } from '@/lib/admin/actions'
import { PROVIDER_KIND_LABELS } from '@jisane/shared/labels'

export interface ProviderItem {
  id: string
  name: string
  kind: string
  type: string
  status: string
  email: string | null
  contact: string | null
  description: string | null
  website: string | null
  auth_user_id: string | null
  created_at: string
}

export interface DraftPackageItem {
  id: string
  name: string
  category: string
  price: number
  is_free: boolean
  target_audience: string
  status: string
  created_at: string
  provider: { name: string }
}

const PROVIDER_STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: '승인 대기', color: 'bg-warning-light text-warning' },
  active: { label: '활동 중', color: 'bg-success-light text-success' },
  rejected: { label: '반려', color: 'bg-error-light text-error' },
  suspended: { label: '중지', color: 'bg-surface text-text-subtle' },
}

const KIND_LABELS = PROVIDER_KIND_LABELS
const TYPE_LABELS: Record<string, string> = {
  consulting: '컨설팅', legal: '법무', tax: '세무', accounting: '회계', insurance: '보험',
}
const CATEGORY_LABELS: Record<string, string> = {
  ax_consulting: 'AX 컨설팅', biz_consulting: '경영 컨설팅', education: '교육',
}

export function PartnerTab({
  providers,
  draftPackages,
}: {
  providers: ProviderItem[]
  draftPackages: DraftPackageItem[]
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleProviderStatus(id: string, status: 'active' | 'rejected' | 'suspended', confirmMsg: string) {
    if (!confirm(confirmMsg)) return
    setBusy(id)
    setError(null)
    const result = await updateProviderStatus(id, status)
    if (result.error) setError(result.error)
    setBusy(null)
  }

  async function handlePackageStatus(id: string, status: 'published' | 'archived', confirmMsg: string) {
    if (!confirm(confirmMsg)) return
    setBusy(id)
    setError(null)
    const result = await updatePackageStatus(id, status)
    if (result.error) setError(result.error)
    setBusy(null)
  }

  const pendingProviders = providers.filter((p) => p.status === 'pending')
  const otherProviders = providers.filter((p) => p.status !== 'pending')

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-xs text-error">{error}</p>}

      {/* 승인 대기 전문가회원 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-text">
          승인 대기 전문가회원 {pendingProviders.length > 0 && <span className="text-warning">({pendingProviders.length})</span>}
        </h3>
        {pendingProviders.length === 0 ? (
          <p className="rounded-lg border border-border-light p-4 text-center text-sm text-text-muted">
            승인 대기 중인 전문가회원이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingProviders.map((p) => (
              <div key={p.id} className="rounded-lg border border-warning/30 bg-warning-light/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text">{p.name}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {KIND_LABELS[p.kind] || p.kind} · {TYPE_LABELS[p.type] || p.type}
                      {p.email && <> · <a href={`mailto:${p.email}`} className="hover:text-accent">{p.email}</a></>}
                      {p.contact && <> · <a href={`tel:${p.contact}`} className="hover:text-accent">{p.contact}</a></>}
                    </p>
                    {p.description && <p className="mt-2 text-xs text-text-muted">{p.description}</p>}
                    {p.website && (
                      <a href={p.website} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-info hover:underline">
                        {p.website}
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busy === p.id}
                      onClick={() => handleProviderStatus(p.id, 'active', `${p.name} 전문가회원을 승인할까요?`)}
                      className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90 disabled:opacity-50"
                    >
                      승인
                    </button>
                    <button
                      type="button"
                      disabled={busy === p.id}
                      onClick={() => handleProviderStatus(p.id, 'rejected', `${p.name} 전문가회원 신청을 반려할까요?`)}
                      className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error-light disabled:opacity-50"
                    >
                      반려
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 검수 대기 서비스 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-text">
          검수 대기 서비스 {draftPackages.length > 0 && <span className="text-warning">({draftPackages.length})</span>}
        </h3>
        {draftPackages.length === 0 ? (
          <p className="rounded-lg border border-border-light p-4 text-center text-sm text-text-muted">
            검수 대기 중인 서비스가 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {draftPackages.map((pkg) => (
              <div key={pkg.id} className="rounded-lg border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text">{pkg.name}</p>
                    <p className="mt-0.5 text-xs text-text-muted">
                      {pkg.provider.name} · {CATEGORY_LABELS[pkg.category] || pkg.category} ·{' '}
                      {pkg.target_audience === 'owner' ? '기업 대상' : '시니어지식인 대상'} ·{' '}
                      {pkg.is_free ? '무료' : `${pkg.price.toLocaleString('ko-KR')}원`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      disabled={busy === pkg.id}
                      onClick={() => handlePackageStatus(pkg.id, 'published', `"${pkg.name}" 서비스를 공개할까요?`)}
                      className="rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-white hover:bg-success/90 disabled:opacity-50"
                    >
                      공개 승인
                    </button>
                    <button
                      type="button"
                      disabled={busy === pkg.id}
                      onClick={() => handlePackageStatus(pkg.id, 'archived', `"${pkg.name}" 서비스를 보관 처리할까요?`)}
                      className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-medium text-error hover:bg-error-light disabled:opacity-50"
                    >
                      보관
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 전체 전문가회원 */}
      <section>
        <h3 className="mb-3 text-sm font-bold text-text">전체 전문가회원</h3>
        {otherProviders.length === 0 ? (
          <p className="rounded-lg border border-border-light p-4 text-center text-sm text-text-muted">
            등록된 전문가회원이 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {otherProviders.map((p) => {
              const badge = PROVIDER_STATUS_BADGE[p.status] || PROVIDER_STATUS_BADGE.pending
              return (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-border-light p-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{p.name}</p>
                    <p className="text-xs text-text-subtle">
                      {KIND_LABELS[p.kind] || p.kind} · {TYPE_LABELS[p.type] || p.type}
                      {!p.auth_user_id && ' · 계정 미연결(관리자 대리)'}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                    {p.status === 'active' ? (
                      <button
                        type="button"
                        disabled={busy === p.id}
                        onClick={() => handleProviderStatus(p.id, 'suspended', `${p.name} 전문가회원을 중지할까요? 등록 서비스 노출은 유지됩니다.`)}
                        className="rounded-lg border border-border-light px-2.5 py-1 text-xs text-text-muted hover:border-error/30 hover:text-error disabled:opacity-50"
                      >
                        중지
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy === p.id}
                        onClick={() => handleProviderStatus(p.id, 'active', `${p.name} 전문가회원을 다시 활성화할까요?`)}
                        className="rounded-lg border border-border-light px-2.5 py-1 text-xs text-text-muted hover:border-success/30 hover:text-success disabled:opacity-50"
                      >
                        활성화
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
