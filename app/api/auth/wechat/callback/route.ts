import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * WeChat OAuth Callback API
 * 處理微信授權回調
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  console.log('[WeChat Callback] Received:', { code, state });

  // 驗證 state
  if (state !== 'MEGAN_LOGIN') {
    console.error('[WeChat Callback] Invalid state:', state);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?error=invalid_state`);
  }

  // 驗證 code
  if (!code) {
    console.error('[WeChat Callback] No code received');
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?error=no_code`);
  }

  try {
    const appid = process.env.WECHAT_APPID!;
    const secret = process.env.WECHAT_SECRET!;

    // 1. 使用 code 換取 access_token
    const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`;

    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    console.log('[WeChat Callback] Token response:', {
      ...tokenData,
      access_token: tokenData.access_token ? '***' : undefined
    });

    if (tokenData.errcode) {
      throw new Error(`WeChat API Error: ${tokenData.errmsg} (${tokenData.errcode})`);
    }

    const { access_token, openid, unionid } = tokenData;

    // 2. 使用 access_token 獲取用戶信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;

    const userInfoResponse = await fetch(userInfoUrl);
    const userInfo = await userInfoResponse.json();

    console.log('[WeChat Callback] User info:', {
      openid: userInfo.openid,
      nickname: userInfo.nickname,
      unionid: userInfo.unionid
    });

    if (userInfo.errcode) {
      throw new Error(`WeChat User Info Error: ${userInfo.errmsg} (${userInfo.errcode})`);
    }

    // 3. 創建或更新 Supabase 用戶
    const supabase = createRouteHandlerClient({ cookies });

    // 檢查用戶是否已存在（通過 unionid 或 openid）
    const identifier = unionid || openid;
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, user_id')
      .eq('wechat_unionid', identifier)
      .single();

    if (existingProfile) {
      // 用戶已存在，建立 session
      // TODO: 使用 Supabase Auth 建立 session
      console.log('[WeChat Callback] Existing user found:', existingProfile.id);

      // 暫時重定向到登入頁面並顯示訊息
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/login?wechat=existing_user`
      );
    } else {
      // 新用戶，創建帳號
      // TODO: 創建 Supabase 用戶並建立 session
      console.log('[WeChat Callback] New user, creating account...');

      // 暫時重定向到登入頁面並顯示訊息
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/login?wechat=new_user&nickname=${encodeURIComponent(userInfo.nickname)}`
      );
    }
  } catch (error: any) {
    console.error('[WeChat Callback] Error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=wechat_auth_failed&message=${encodeURIComponent(error.message)}`
    );
  }
}
