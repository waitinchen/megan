import { NextResponse } from 'next/server';

/**
 * WeChat OAuth Login API
 * 處理微信登入流程
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    // TODO: 實現微信 OAuth 流程
    // 1. 使用 code 向微信服務器獲取 access_token
    // 2. 使用 access_token 獲取用戶信息
    // 3. 創建或更新 Supabase 用戶
    // 4. 建立 Supabase session

    console.log('[WeChat Login] Received code:', code);
    console.log('[WeChat Login] State:', state);

    return NextResponse.json({
      status: 'under_development',
      message: '微信登入功能開發中',
      code,
      state
    });
  } catch (error: any) {
    console.error('[WeChat Login] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // TODO: 處理微信登入 POST 請求
    console.log('[WeChat Login POST] Body:', body);

    return NextResponse.json({
      status: 'under_development',
      message: '微信登入功能開發中'
    });
  } catch (error: any) {
    console.error('[WeChat Login POST] Error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
