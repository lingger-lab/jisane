import Link from 'next/link'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      {/* 전역 헤더(루트 layout의 AppHeader)가 이미 sticky로 상단을 담당한다.
          과거 이 레이아웃도 자체 sticky 헤더를 렌더해 헤더가 2개로 겹쳤다 →
          중복 제거. 마케팅 링크(거래표준·서비스안내·AX전환)는 하단 푸터에 유지된다. */}
      <main className="flex-1">{children}</main>

      <footer className="border-t border-border-light bg-surface py-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-4 px-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-text">
                지사네 <span className="font-normal text-text-muted">(jisane)</span>
              </p>
              <p className="mt-1 text-xs text-text-subtle">지식나눔 사업협력 네트워크</p>
            </div>
            <p className="text-xs text-text-subtle">운영: (주)지사네</p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-subtle">
            <span>사업자등록번호: 405-02-46113</span>
            <span>이메일: iamblackwhite86@gmail.com</span>
          </div>
          {/* min-h-6: 24×24px 최소 타깃(WCAG 2.5.8) */}
          <div className="flex gap-3 text-xs">
            <Link href="/privacy" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">개인정보처리방침</Link>
            <Link href="/service" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">서비스 안내</Link>
            <Link href="/standard/scope" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">용역 명세서</Link>
            <Link href="/standard/guarantee" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">적립금 규정</Link>
            <Link href="/ax" className="inline-flex min-h-6 items-center text-text-subtle hover:text-text-muted transition-colors">AX 전환</Link>
          </div>
          <hr className="border-border-light" />
          <p className="text-xs text-text-subtle">&copy; {new Date().getFullYear()} (주)지사네. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
