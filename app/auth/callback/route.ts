export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      console.error('[Auth Callback] No code provided');
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?error=no_code`
      );
    }

    // Supabase 自動交換 session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Auth Callback] Error exchanging code:', error);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?error=auth_failed`
      );
    }

    console.log('[Auth Callback] Successfully exchanged code for session');

    // 登入後導向 /welcome（會自動檢查是否有暱稱）
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/welcome`
    );
  } catch (error: any) {
    console.error('[Auth Callback] Unexpected error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/login?error=server_error`
    );
  }
}


