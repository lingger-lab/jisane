import { brandJIcon } from '@jisane/shared/brand-icon'

// PWA 매니페스트용 192 아이콘(홈 화면). 브랜드 J 모노그램.
export const runtime = 'edge'
export function GET() {
  return brandJIcon(192)
}
