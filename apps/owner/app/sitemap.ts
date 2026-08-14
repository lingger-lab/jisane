// self-contained (커스텀 Next 포크 route-entry가 workspace/type import 파싱 실패)
export default function sitemap() {
  return [
    {
      url: 'https://owner.jisane.cloud',
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
  ]
}
