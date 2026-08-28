import { brandJIcon } from '@jisane/shared/brand-icon'

// iOS "홈 화면에 추가" 아이콘(apple-touch-icon). iOS는 매니페스트 아이콘 대신 이걸 쓴다.
export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return brandJIcon(180)
}
