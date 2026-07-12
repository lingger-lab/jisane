import { PartnerNav } from '@/components/partner-nav'

export default function BrowseLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col pb-16">
      {children}
      <PartnerNav />
    </div>
  )
}
