import Link from 'next/link'

/** 전문가회원 공통 레이아웃 — 가드 없음 (공개/비공개는 하위 레이아웃이 판단) */
export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <nav className="border-b border-border-light bg-background px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/partner" className="text-lg font-bold text-partner">전문가회원</Link>
          <Link href="/partner/dashboard" className="text-sm text-text-muted hover:text-text transition-colors">
            대시보드
          </Link>
        </div>
      </nav>
      <main className="flex-1">{children}</main>
    </>
  )
}
