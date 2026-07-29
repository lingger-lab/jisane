import { PackageForm } from '../package-form'

export const metadata = { title: '서비스 등록 | 지사네 파트너공간' }

export default function NewServicePackagePage() {
  return (
    <div className="animate-fade-in">
      <h1 className="mb-1 text-lg font-bold text-text">서비스 등록</h1>
      <p className="mb-5 text-sm text-text-muted">
        등록하면 <strong className="text-text">비공개(검수 대기)</strong> 상태로 저장되고,
        관리자 검수 후 게시판에 공개됩니다.
      </p>
      <PackageForm />
    </div>
  )
}
