export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

/**
 * WeChat OAuth Login API
 * 重定向到微信授權頁面
 */
export async function GET(req: NextRequest) {
  const appid = process.env.WECHAT_APPID;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // 如果沒有配置 WECHAT_APPID，返回開發中提示
  if (!appid) {
    console.warn('[WeChat Login] WECHAT_APPID not configured');
    return NextResponse.json({
      status: 'not_configured',
      message: '微信登入功能未配置 WECHAT_APPID',
      instruction: '請在 .env.local 添加 WECHAT_APPID=your_app_id'
    }, { status: 503 });
  }

  const redirect = encodeURIComponent(
    `${baseUrl}/api/auth/wechat/callback`
  );

  const state = 'MEGAN_LOGIN';

  // 微信開放平台網站應用 OAuth 授權
  const url =
    `https://open.weixin.qq.com/connect/qrconnect?appid=${appid}` +
    `&redirect_uri=${redirect}` +
    `&response_type=code&scope=snsapi_login&state=${state}#wechat_redirect`;

  console.log('[WeChat Login] Redirecting to:', url);

  return NextResponse.redirect(url);
}

