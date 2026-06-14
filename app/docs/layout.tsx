import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '곁에 - 서류',
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-black print:bg-white">
      {children}
    </div>
  )
}
