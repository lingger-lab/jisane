import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

// RLS를 우회하는 관리자 전용 클라이언트.
// 정산 실행, 매칭 확정 등 관리자 작업에만 사용.
// 절대 클라이언트 코드에서 import하지 않는다.
export const adminClient = createClient(supabaseUrl, supabaseSecretKey);
