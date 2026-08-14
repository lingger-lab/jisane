export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/members', '/login', '/partner/dashboard', '/docs'],
    },
    sitemap: 'https://jisane.cloud/sitemap.xml',
    host: 'https://jisane.cloud',
  }
}
