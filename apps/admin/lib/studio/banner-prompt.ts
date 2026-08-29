/**
 * 배너 이미지 프롬프트 생성 — axdashboard 배너이미지셋팅 이식(순수·결정적, 단위테스트 대상).
 * 지식서비스(제목·설명·제공내용·카테고리)로 텍스트레이아웃×배경×텍스트스타일×팔레트를 조합한
 * 16:9 썸네일 생성 프롬프트를 만든다. 관리자가 복사해 Gemini(나노바나나)에 붙여 이미지를 생성.
 */

const TEXT_LAYOUTS = [
  { name: 'center-hero', prompt: 'Text layout: The headline "{title}" is massive and centered, dominating the middle 60% of the image. Subtitle "{subtitle}" sits directly below in a smaller but still bold font. Everything radiates outward from this central text block.' },
  { name: 'bottom-bar', prompt: 'Text layout: The bottom third of the image is a bold text zone. Headline "{title}" spans the full width in huge letters near the bottom. Subtitle "{subtitle}" is tucked just above it. The top two-thirds is pure visual with a dark gradient overlay fading down into the text zone.' },
  { name: 'left-stack', prompt: 'Text layout: The left half of the image is the text zone. Headline "{title}" is left-aligned in huge bold horizontal text stacked in 1-2 lines. Subtitle "{subtitle}" sits below in a smaller horizontal line. The right half is filled with the background visual. All text is perfectly horizontal — no rotation, no angles.' },
  { name: 'top-corner', prompt: 'Text layout: The headline "{title}" is anchored in the top-left corner in extra-large bold text, taking up roughly 40% of the width. Subtitle "{subtitle}" sits right below it. The rest of the image is filled with the background visual, creating an asymmetric, dynamic composition.' },
  { name: 'right-text', prompt: 'Text layout: The right half of the image is the text zone. Headline "{title}" is right-aligned in huge bold letters. Subtitle "{subtitle}" is right-aligned below it. The left half is filled with the background visual, creating a strong left-to-right visual flow.' },
  { name: 'full-overlay', prompt: 'Text layout: The headline "{title}" is rendered in massive bold horizontal text spanning nearly the full image width, vertically centered. Subtitle "{subtitle}" sits in a smaller horizontal line just below. The background visual is visible behind and around the text with a dark semi-transparent overlay for contrast. All text is perfectly horizontal — no rotation, no angles.' },
] as const

const BACKGROUND_STYLES = [
  { name: 'gradient-dark', prompt: 'Background: Deep dark gradient transitioning between two rich colors, with subtle neon glow accents and light particles floating in the dark space. Moody, cinematic atmosphere.' },
  { name: 'product-mockup', prompt: 'Background: A modern dashboard or app interface screenshot rendered at an angle with a strong gaussian blur (radius 20+) and a colored tint overlay at 40% opacity. The blurred UI creates a tech-professional context without competing with the text.' },
  { name: 'abstract-shapes', prompt: 'Background: Bold geometric shapes — circles, triangles, hexagons — in saturated colors floating at various sizes and depths. Some shapes are semi-transparent, overlapping to create depth. Clean and modern with a slight 3D perspective.' },
  { name: 'photo-blur', prompt: 'Background: A relevant real-world photograph heavily blurred with gaussian blur and overlaid with a rich color gradient at 50% opacity. The photo provides organic texture while the color overlay ensures text readability and brand cohesion.' },
  { name: 'bold-solid', prompt: 'Background: A single bold, saturated color fills the entire background. One large, simple icon or symbol (related to the topic) is rendered at 15% opacity as a watermark-scale element behind the text, creating subtle depth without distraction.' },
  { name: 'split-color', prompt: 'Background: The image is divided into 2-3 bold color blocks with clean geometric edges (vertical split, horizontal split, or angular). Each block is a different saturated color from the palette, creating a striking color-block composition.' },
] as const

const TEXT_STYLES = [
  { name: 'thick-outline', prompt: 'Text style: Every letter has a thick black outline (4-6px stroke) with a bright colored fill. The outline makes text pop against ANY background. Bold sans-serif typeface, extremely legible even at small thumbnail sizes.' },
  { name: 'glow-neon', prompt: 'Text style: The text has a vivid neon glow effect — letters emit light with a soft colored halo radiating outward. The glow color matches the accent palette. Dark text fill with bright outer glow. Futuristic, electric feel.' },
  { name: 'color-strip', prompt: 'Text style: Each line of text sits on an opaque colored banner/strip — a solid rectangle of accent color behind each text line. White or contrasting text on the colored strip. The strips have slightly rounded corners. Clean, editorial, magazine-cover style.' },
  { name: 'gradient-text', prompt: 'Text style: The text itself is filled with a vibrant gradient that shifts across the letters — from one palette color to another. No outline needed because the gradient fill creates enough contrast. Extra-bold weight to show off the gradient fill.' },
  { name: 'shadow-3d', prompt: 'Text style: The text has a strong 3D drop shadow offset to the bottom-right, creating a pop-up effect as if the letters are floating above the background. The shadow is a darker shade of the background color. Text fill is bright and solid. Depth and dimension.' },
] as const

export type BrandPalette =
  | 'jisane' | 'youtube' | 'naver' | 'kakao' | 'claude'
  | 'instagram' | 'linkedin' | 'toss' | 'twitch'

const BRAND_PALETTES: Record<BrandPalette, { palette: string; mood: string; accentColor: string }> = {
  jisane: { palette: 'deep forest green (#1f5c46), warm amber (#b06a1e), and hanji cream (#f7f3e9)', mood: 'trustworthy, warm, professional Korean', accentColor: 'amber (#b06a1e)' },
  youtube: { palette: 'bold red (#FF0000), white, and dark charcoal black', mood: 'energetic, bold, attention-grabbing', accentColor: 'YouTube red (#FF0000)' },
  naver: { palette: 'Naver green (#03C75A), white, and dark forest green', mood: 'trustworthy, fresh, Korean digital', accentColor: 'Naver green (#03C75A)' },
  kakao: { palette: 'KakaoTalk yellow (#FEE500), warm brown (#3C1E1E), and cream white', mood: 'friendly, warm, approachable', accentColor: 'Kakao yellow (#FEE500)' },
  claude: { palette: 'Claude orange (#E87B35), warm terracotta (#D4755A), and soft cream', mood: 'intelligent, warm, thoughtful', accentColor: 'Claude orange (#E87B35)' },
  instagram: { palette: 'Instagram gradient — magenta (#E1306C), purple (#833AB4), and sunset orange (#F77737)', mood: 'vibrant, creative, trendy', accentColor: 'Instagram magenta (#E1306C)' },
  linkedin: { palette: 'LinkedIn blue (#0A66C2), white, and professional navy (#004182)', mood: 'professional, credible, business-focused', accentColor: 'LinkedIn blue (#0A66C2)' },
  toss: { palette: 'Toss blue (#0064FF), clean white, and light sky blue', mood: 'simple, modern, fintech-clean', accentColor: 'Toss blue (#0064FF)' },
  twitch: { palette: 'Twitch purple (#9146FF), deep violet (#6441A5), and white', mood: 'playful, energetic, live-streaming', accentColor: 'Twitch purple (#9146FF)' },
}

export const PALETTE_LABELS: Record<BrandPalette, string> = {
  jisane: '지사네 (딥그린·앰버)',
  youtube: '유튜브 (빨강)',
  naver: '네이버 (초록)',
  kakao: '카카오톡 (노랑)',
  claude: '클로드 (주황)',
  instagram: '인스타그램 (그라데이션)',
  linkedin: '링크드인 (블루)',
  toss: '토스 (블루)',
  twitch: '트위치 (보라)',
}

const CATEGORY_VISUAL: Record<string, string> = {
  ax_consulting: 'digital dashboard, data charts, AI/automation UI elements',
  biz_consulting: 'professional business consulting, documents, growth charts',
  education: 'collaborative workshop, learning environment, interactive session',
}
const DEFAULT_VISUAL = 'modern digital product, clean tech interface'

export interface BannerPromptInput {
  title: string
  subtitle: string
  features: string[]
  category: string
}

function mod(n: number, m: number): number {
  return ((n % m) + m) % m
}

export function generateBannerPrompt(input: BannerPromptInput, seed: number, palette: BrandPalette = 'jisane'): string {
  const layout = TEXT_LAYOUTS[mod(seed, TEXT_LAYOUTS.length)]
  const bg = BACKGROUND_STYLES[mod(Math.floor(seed / TEXT_LAYOUTS.length), BACKGROUND_STYLES.length)]
  const textStyle = TEXT_STYLES[mod(Math.floor(seed / (TEXT_LAYOUTS.length * BACKGROUND_STYLES.length)), TEXT_STYLES.length)]

  const paletteInfo = BRAND_PALETTES[palette] ?? BRAND_PALETTES.jisane
  const typeVisual = CATEGORY_VISUAL[input.category] ?? DEFAULT_VISUAL

  const title = input.title
  const subtitle = input.subtitle || input.title
  const features = input.features.slice(0, 3).join(', ')

  const layoutPrompt = layout.prompt.replaceAll('{title}', title).replaceAll('{subtitle}', subtitle)

  return [
    'YouTube-style 16:9 thumbnail (1280x720). High contrast, high saturation, bold and eye-catching.',
    `Topic: ${title}${subtitle !== title ? ` — ${subtitle}` : ''}.`,
    '',
    'TEXT IS THE HERO ELEMENT — text must be large, bold, and dominate at least 50% of the image. This is a thumbnail where text grabs attention first, not a subtle overlay. IMPORTANT: All text must be perfectly horizontal — no diagonal, no rotation, no angled text whatsoever.',
    '',
    layoutPrompt,
    '',
    textStyle.prompt,
    '',
    `${bg.prompt} Color palette: ${paletteInfo.palette}. Mood: ${paletteInfo.mood}. Accent color for highlights: ${paletteInfo.accentColor}.`,
    '',
    `Visual elements: ${typeVisual}${features ? `. Key features: ${features}` : ''}.`,
    '',
    'No watermarks, no logos. The text itself is the design — make it impossible to ignore. Write all text in Korean if the topic is Korean.',
  ].join('\n')
}

export const TOTAL_COMBINATIONS = TEXT_LAYOUTS.length * BACKGROUND_STYLES.length * TEXT_STYLES.length

export function getComboLabel(seed: number): string {
  const layout = TEXT_LAYOUTS[mod(seed, TEXT_LAYOUTS.length)]
  const bg = BACKGROUND_STYLES[mod(Math.floor(seed / TEXT_LAYOUTS.length), BACKGROUND_STYLES.length)]
  const textStyle = TEXT_STYLES[mod(Math.floor(seed / (TEXT_LAYOUTS.length * BACKGROUND_STYLES.length)), TEXT_STYLES.length)]
  return `${layout.name} + ${bg.name} + ${textStyle.name}`
}
