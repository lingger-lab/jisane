import { brandJIcon } from '@jisane/shared/brand-icon'

// PWA 매니페스트용 512 아이콘(홈 화면·스플래시). 브랜드 J 모노그램(maskable 세이프존).
export const runtime = 'edge'
export function GET() {
  return brandJIcon(512)
}
