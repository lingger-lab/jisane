import { redirect } from 'next/navigation'
import Link from 'next/link'
import { adminClient } from '@jisane/shared/supabase/admin'
import { verifyAdmin } from '@jisane/shared/auth/server-helpers'
import { BannerPromptView, type BannerServiceRow } from './banner-prompt-view'

export const metadata = { title: '배너 이미지 셋팅 | 지사네 관리자' }

export default async function BannerSettingPage() {
  let isAdmin = false
  try { await verifyAdmin(); isAdmin = true } catch { /* not admin */ }
  if (!isAdmin) redirect('/login?error=forbidden')

  const { data } = await adminClient
    .from('service_package')
    .select('id, name, value_desc, description, deliverables, category, status')
    .order('created_at', { ascending: false })

  const services = (data ?? []) as unknown as BannerServiceRow[]

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-6 py-6 animate-fade-in">
      <div className="mb-5">
        <Link href="/dashboard/knowledge-studio" className="mb-2 inline-flex items-center gap-1 text-sm text-text-muted hover:text-text">
          &larr; 스튜디오
        </Link>
        <h1 className="text-lg font-serif font-bold text-text">배너 이미지 셋팅</h1>
        <p className="mt-0.5 text-sm text-text-muted">
          지식서비스를 고르면 16:9 배너 이미지 생성 프롬프트가 만들어집니다. 복사해 Gemini(나노바나나)에 붙여 이미지를 생성한 뒤,
          각 서비스 편집화면의 <span className="font-medium text-text">배너 업로드</span>로 올리세요.
        </p>
      </div>
      <BannerPromptView services={services} />
    </div>
  )
}
