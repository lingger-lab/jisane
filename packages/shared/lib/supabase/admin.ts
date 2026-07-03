import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient;

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing required env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SECRET_KEY",
      );
    }
    _client = createClient(url, key);
  }
  return _client;
}

// RLS를 우회하는 관리자 전용 클라이언트.
// 정산 실행, 매칭 확정 등 관리자 작업에만 사용.
// 절대 클라이언트 코드에서 import하지 않는다.
//
// Proxy로 감싸서 빌드 시 모듈 평가 단계에서 createClient가 호출되지 않도록 함.
// 런타임에 첫 접근 시 초기화됨.
export const adminClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getClient();
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
