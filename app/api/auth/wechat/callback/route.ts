import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * WeChat OAuth Callback API
 * 完整流程：code → access_token → userinfo → unionid → Supabase login
 * 參考：謀謀提供的《WeChat Website Login — 完整技術整合指南》
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  console.log('[WeChat Callback] Received:', { code: code ? '***' : null, state });

  // 驗證 state (防止 CSRF)
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
    const supabase = createRouteHandlerClient({ cookies });

    // ========================================
    // 步驟 1: 用 code 換 access_token
    // ========================================
    const accessUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appid}&secret=${secret}&code=${code}&grant_type=authorization_code`;

    console.log('[WeChat Callback] Exchanging code for access_token...');
    const accessRes = await fetch(accessUrl);
    const accessData = await accessRes.json();

    if (accessData.errcode) {
      console.error('[WeChat Callback] Access token error:', accessData);
      throw new Error(`WeChat API Error: ${accessData.errmsg} (${accessData.errcode})`);
    }

    const {
      access_token,
      refresh_token,
      openid,
      unionid,
    } = accessData;

    console.log('[WeChat Callback] Access token received:', {
      openid,
      unionid: unionid || 'not provided',
      has_refresh_token: !!refresh_token
    });

    // ========================================
    // 步驟 2: 用 access_token + openid 獲取用戶信息
    // ========================================
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;

    console.log('[WeChat Callback] Fetching user info...');
    const userInfoRes = await fetch(userInfoUrl);
    const userInfo = await userInfoRes.json();

    if (userInfo.errcode) {
      console.error('[WeChat Callback] User info error:', userInfo);
      throw new Error(`WeChat User Info Error: ${userInfo.errmsg} (${userInfo.errcode})`);
    }

    console.log('[WeChat Callback] User info received:', {
      openid: userInfo.openid,
      nickname: userInfo.nickname,
      has_avatar: !!userInfo.headimgurl
    });

    // ========================================
    // 步驟 3: unionid 優先，沒有則用 openid
    // ========================================
    const uniqueId = unionid ?? openid;
    console.log('[WeChat Callback] Unique ID:', uniqueId);

    // 使用 uniqueId 作為密碼（對所有微信用戶統一）
    const virtualEmail = `${uniqueId}@wechat.megan.fake`;
    const password = uniqueId; // 使用 uniqueId 作為密碼

    // ========================================
    // 步驟 4: 查詢 Supabase 是否已有此用戶
    // ========================================
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, nickname, wechat_unionid')
      .eq('wechat_unionid', uniqueId)
      .maybeSingle();

    let userId: string;
    let isNewUser = false;

    if (!profile) {
      // ========================================
      // 步驟 5: 新用戶 - 創建帳號
      // ========================================
      console.log('[WeChat Callback] New user, creating account...');
      isNewUser = true;

      // 創建 Supabase Auth 用戶
      const { data: authData, error: signUpErr } = await supabase.auth.signUp({
        email: virtualEmail,
        password: password, // 使用 uniqueId 作為密碼
        options: {
          data: {
            provider: 'wechat',
            wechat_openid: openid,
            wechat_unionid: uniqueId,
          }
        }
      });

      if (signUpErr || !authData.user) {
        console.error('[WeChat Callback] Sign up error:', signUpErr);
        throw signUpErr || new Error('Failed to create user');
      }

      userId = authData.user.id;
      console.log('[WeChat Callback] Auth user created:', userId);

      // 創建 profile 記錄
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          nickname: userInfo.nickname || '微信用戶',
          wechat_unionid: uniqueId,
          wechat_openid: openid,
          wechat_nickname: userInfo.nickname,
          wechat_avatar: userInfo.headimgurl,
          avatar_url: userInfo.headimgurl, // 同時設為用戶頭像
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (profileErr) {
        console.error('[WeChat Callback] Profile creation error:', profileErr);
        throw profileErr;
      }

      console.log('[WeChat Callback] Profile created successfully');
    } else {
      // ========================================
      // 步驟 6: 現有用戶 - 更新信息並登入
      // ========================================
      console.log('[WeChat Callback] Existing user found:', profile.id);
      userId = profile.id;

      // 更新微信信息（頭像和暱稱可能有變化）
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          wechat_nickname: userInfo.nickname,
          wechat_avatar: userInfo.headimgurl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateErr) {
        console.warn('[WeChat Callback] Profile update warning:', updateErr);
      }

      // 使用 signInWithPassword 登入現有用戶
      console.log('[WeChat Callback] Signing in existing user...');
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: virtualEmail,
        password: password,
      });

      if (signInErr) {
        console.error('[WeChat Callback] Sign in error:', signInErr);
        throw signInErr;
      }

      console.log('[WeChat Callback] Existing user signed in successfully');
    }

    // ========================================
    // 步驟 7: 重定向到主頁或歡迎頁
    // ========================================
    // signUp 或 signInWithPassword 已經自動建立了 session
    const redirectUrl = isNewUser
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/welcome` // 新用戶 → 歡迎頁
      : `${process.env.NEXT_PUBLIC_SITE_URL}/`; // 現有用戶 → 主頁

    console.log('[WeChat Callback] Login successful, redirecting to:', redirectUrl);

    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error('[WeChat Callback] Fatal error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/login?error=wechat_auth_failed&message=${encodeURIComponent(error.message || '未知錯誤')}`
    );
  }
}
