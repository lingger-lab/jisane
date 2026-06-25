import { NextResponse } from "next/server";
import { adminClient } from "@jisane/shared/supabase/admin";

export async function GET() {
  try {
    // Supabase 연결 확인 (auth.getUser는 키 검증용)
    const {
      data: { users },
      error,
    } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });

    if (error) {
      return NextResponse.json(
        { status: "error", message: "Supabase 연결 실패" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: "ok",
      supabase: "connected",
      userCount: users?.length ?? 0,
    });
  } catch {
    return NextResponse.json(
      { status: "error", message: "서버 오류" },
      { status: 500 }
    );
  }
}
