// self-contained (커스텀 Next 포크 route-entry가 workspace/type import 파싱 실패)
// AI 답변엔진 크롤러를 명시적으로 허용 — AEO(GPTBot/ClaudeBot/PerplexityBot 등)에 의도적 신호.
const AI_BOTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
  'CCBot',
  'Applebot-Extended',
]

export default function robots() {
  const disallow = ['/dashboard', '/members', '/login', '/partner/dashboard', '/docs']
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/', disallow })),
    ],
    sitemap: 'https://jisane.cloud/sitemap.xml',
    host: 'https://jisane.cloud',
  }
}
