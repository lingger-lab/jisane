import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// supabase-js 기본 fetch에는 타임아웃이 없어, DB/PostgREST가 에러 대신 행에 걸리면
// 서버 렌더·크론 체인 전체가 같이 매달린다(감사 docs/11 P3-103·P3-111). 쿼리 p95는
// 수백 ms 수준이므로 15초는 충분한 여유이면서 무한 대기를 막는다. 타임아웃 시
// TimeoutError로 실패해 각 호출부의 기존 error 처리 경로로 표면화된다.
const SUPABASE_FETCH_TIMEOUT_MS = 15_000;

function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const timeoutSignal = AbortSignal.timeout(SUPABASE_FETCH_TIMEOUT_MS);
  // 호출자가 .abortSignal()로 넘긴 signal이 있으면 둘 다 존중한다.
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeoutSignal])
    : timeoutSignal;
  return fetch(input, { ...init, signal });
}

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
    _client = createClient(url, key, {
      global: { fetch: fetchWithTimeout },
    });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Proxy 동적 prop 위임은 정적 타입으로 표현 불가
    const value = (client as any)[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
