import { KakaoIcon } from './icons/kakao'
import { cn } from '../lib/cn'

/**
 * 카카오 채널 추가 버튼 — 친구톡 발송 대상(채널 친구)을 모으는 유입구.
 * NEXT_PUBLIC_KAKAO_CHANNEL_ID(채널 공개 ID)가 설정되기 전에는 렌더하지 않는다(채널 준비 후 활성).
 */
export function KakaoChannelButton({ className }: { className?: string }) {
  const id = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_ID
  if (!id) return null
  return (
    <a
      href={`https://pf.kakao.com/${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex items-center gap-2 rounded-lg bg-[#FEE500] px-4 py-2 text-sm font-semibold text-[#191600] transition-opacity hover:opacity-90',
        className,
      )}
    >
      <KakaoIcon className="h-4 w-4" />
      카카오 채널 추가
    </a>
  )
}
