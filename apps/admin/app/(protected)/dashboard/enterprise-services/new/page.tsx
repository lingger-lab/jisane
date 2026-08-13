import { redirect } from 'next/navigation'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { EnterprisePackageForm } from '../enterprise-package-form'

export const metadata = { title: '기업 전문서비스 등록 | 지사네 관리자' }

export default async function NewEnterpriseServicePage() {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 animate-fade-in">
      <h1 className="mb-1 text-lg font-serif font-bold text-text">기업 전문서비스 등록</h1>
      <p className="mb-5 text-sm text-text-muted">
        등록하면 선택한 공개 상태로 반영됩니다. 가격정책이 확정 전이면 &ldquo;가격 미정(상담 문의)&rdquo;을 선택하세요.
      </p>
      <EnterprisePackageForm />
    </div>
  )
}
