import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '지사네 - 서류',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-gray-900 print:text-black">
      {children}
    </div>
  )
}
