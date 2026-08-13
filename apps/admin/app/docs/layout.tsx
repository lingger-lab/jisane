import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '지사네 - 서류',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    // 인쇄용 법적 서류 — 다크 앱 안에서도 흰 문서(종이)로 유지(라이트 고정).
    <div data-theme="light" className="min-h-screen bg-white text-gray-900 print:text-black">
      {children}
    </div>
  )
}
