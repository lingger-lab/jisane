import { adminClient } from '../supabase/admin'

/**
 * 지식서비스 배너 업로드 헬퍼(서버 전용, service role).
 * 클라이언트 직접쓰기 정책을 열지 않고 서버가 signed upload URL을 발급 → 클라가 그 URL로 PUT.
 * 저장 시 banner_url이 본인 provider 경로인지 검증해 임의 URL·타인 배너 주입을 막는다.
 */

export const SERVICE_BANNER_BUCKET = 'service-banners'

export interface BannerUploadTarget {
  bucket: string
  path: string
  token: string
  publicUrl: string
}

/**
 * NEXT_PUBLIC_SUPABASE_URL은 배포/로컬에서 끝에 공백·CR/LF(\r\n)가 섞여 들어오는 사고가 있었다
 * (env 값에 개행 혼입 → URL 중간에 \r\n이 박혀 이미지 깨짐). 여기서 한 번 정규화해 뒤따르는 모든
 * URL 조합이 깨끗하도록 방어한다. 후행 슬래시도 정리.
 */
function supabaseBase(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
}

function publicUrlFor(path: string): string {
  return `${supabaseBase()}/storage/v1/object/public/${SERVICE_BANNER_BUCKET}/${path}`
}

/**
 * provider 경로에 배너 업로드용 signed URL 발급. Storage 미구성/오류 시 null(폼은 배너 없이 계속).
 * 경로 규약: banners/{providerId}/{uuid}.webp
 */
export async function issueBannerUploadUrl(providerId: string): Promise<BannerUploadTarget | null> {
  const path = `banners/${providerId}/${crypto.randomUUID()}.webp`
  const { data, error } = await adminClient.storage
    .from(SERVICE_BANNER_BUCKET)
    .createSignedUploadUrl(path)
  if (error || !data) return null
  return {
    bucket: SERVICE_BANNER_BUCKET,
    path: data.path,
    token: data.token,
    publicUrl: publicUrlFor(data.path),
  }
}

/**
 * 저장하려는 banner_url이 해당 provider의 배너 경로인지 검증. null/빈값은 허용(배너 미설정/제거).
 * 서버 액션에서 banner_url을 DB에 쓰기 전 반드시 통과시킨다.
 */
export function isOwnBannerUrl(url: string | null | undefined, providerId: string): boolean {
  if (!url) return true
  const prefix = `${supabaseBase()}/storage/v1/object/public/${SERVICE_BANNER_BUCKET}/banners/${providerId}/`
  return url.trim().startsWith(prefix)
}
