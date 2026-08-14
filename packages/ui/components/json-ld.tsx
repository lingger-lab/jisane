/**
 * JSON-LD 구조화 데이터 렌더러 — <script type="application/ld+json">.
 * 서버 컴포넌트. `<` 이스케이프로 </script> 브레이크아웃(XSS) 방지.
 * data는 @jisane/shared/seo의 빌더(orgJsonLd 등) 반환 객체(또는 배열).
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
