export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  // Supabase 自動交換 session
  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  // 登入後導向 /welcome（會自動檢查是否有暱稱）
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/welcome`
  );
}


