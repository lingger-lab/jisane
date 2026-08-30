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
  const disallow = ['/mypage', '/status', '/request', '/services', '/experts', '/education', '/callback']
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow },
      ...AI_BOTS.map((userAgent) => ({ userAgent, allow: '/', disallow })),
    ],
    sitemap: 'https://owner.jisane.cloud/sitemap.xml',
    host: 'https://owner.jisane.cloud',
  }
}
