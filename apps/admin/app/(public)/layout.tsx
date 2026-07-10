import Link from 'next/link'
import { OwlIcon } from '@jisane/ui/icons/owl'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border-light bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-1.5 text-xl font-bold text-primary tracking-tight hover:opacity-80 transition-opacity">
            <OwlIcon className="h-7 w-7 text-primary" />
            지사네
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/standard/scope" className="text-xs text-text-muted hover:text-text transition-colors">거래 표준</Link>
            <Link href="/ax" className="text-xs text-text-muted hover:text-text transition-colors">AX 전환</Link>
            <Link href="/service" className="text-xs text-text-muted hover:text-text transition-colors">서비스 안내</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border-light bg-surface py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-text">
                지사네 <span className="font-normal text-text-muted">(jisane)</span>
              </p>
              <p className="mt-1 text-xs text-text-subtle">만든 사람이 갖는다</p>
            </div>
            <p className="text-xs text-text-subtle">운영: (주)지사네</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
            <span>사업자등록번호: 405-02-46113</span>
            <span>이메일: iamblackwhite86@gmail.com</span>
          </div>
          <div className="flex gap-3 text-xs">
            <Link href="/privacy" className="text-text-subtle hover:text-text-muted transition-colors">개인정보처리방침</Link>
            <Link href="/service" className="text-text-subtle hover:text-text-muted transition-colors">서비스 안내</Link>
            <Link href="/standard/scope" className="text-text-subtle hover:text-text-muted transition-colors">용역 명세서</Link>
            <Link href="/standard/guarantee" className="text-text-subtle hover:text-text-muted transition-colors">적립금 규정</Link>
            <Link href="/ax" className="text-text-subtle hover:text-text-muted transition-colors">AX 전환</Link>
          </div>
          <hr className="border-border-light" />
          <p className="text-xs text-text-subtle">&copy; 2026 (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
