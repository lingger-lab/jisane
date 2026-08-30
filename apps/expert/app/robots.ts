// self-contained (커스텀 Next 포크 route-entry가 workspace/type import 파싱 실패)
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
  // /education 카탈로그는 허브 /knowledge 로 canonical 집약 — 중복 색인 방지 위해 크롤 차단
  const disallow = ['/mypage', '/requests', '/work', '/matching', '/invitations', '/register', '/callback', '/education']
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/', disallow })),
    ],
    sitemap: 'https://expert.jisane.cloud/sitemap.xml',
    host: 'https://expert.jisane.cloud',
  }
}
