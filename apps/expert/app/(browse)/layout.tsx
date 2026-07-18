import { ExpertNav } from '@/components/expert-nav'

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-16">
      {children}
      <ExpertNav />
    </div>
  )
}
