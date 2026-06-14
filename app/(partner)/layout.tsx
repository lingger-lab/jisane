import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PartnerNav } from '@/components/partner-nav'

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col pb-14">
      {children}
      <PartnerNav />
    </div>
  )
}
