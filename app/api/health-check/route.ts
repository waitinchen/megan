import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // 1. 檢查 Supabase 環境變數
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  results.checks.supabase = {
    status: 'unknown',
    message: '',
    details: {},
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    results.checks.supabase.status = 'error';
    results.checks.supabase.message = '環境變數未設定';
    results.checks.supabase.details = {
      url: supabaseUrl ? '✅ 已設定' : '❌ 未設定',
      anonKey: supabaseAnonKey ? '✅ 已設定' : '❌ 未設定',
    };
  } else {
    try {
      // 測試 Supabase 連線
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // 檢查 auth 服務
      const { data: authData, error: authError } = await supabase.auth.getSession();
      
      if (authError && authError.message.includes('Invalid API key')) {
        results.checks.supabase.status = 'error';
        results.checks.supabase.message = 'API Key 無效';
        results.checks.supabase.details = {
          url: supabaseUrl,
          error: authError.message,
        };
      } else {
        results.checks.supabase.status = 'ok';
        results.checks.supabase.message = '連線正常';
        results.checks.supabase.details = {
          url: supabaseUrl,
          anonKey: supabaseAnonKey.substring(0, 20) + '...',
        };
      }
    } catch (error: any) {
      results.checks.supabase.status = 'error';
      results.checks.supabase.message = '連線失敗';
      results.checks.supabase.details = {
        error: error.message,
      };
    }
  }

  // 2. 檢查 Google OAuth 設定（透過 Supabase）
  results.checks.googleOAuth = {
    status: 'unknown',
    message: '',
    details: {},
  };

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // 檢查是否可以獲取 OAuth providers（這需要管理權限，所以我們只能檢查連線）
      // 實際的 OAuth 設定檢查需要在前端或透過管理 API
      results.checks.googleOAuth.status = 'warning';
      results.checks.googleOAuth.message = '需要手動確認 Supabase Dashboard 設定';
      results.checks.googleOAuth.details = {
        note: '請確認 Supabase Dashboard → Authentication → Providers → Google 已正確設定',
      };
    } catch (error: any) {
      results.checks.googleOAuth.status = 'error';
      results.checks.googleOAuth.message = '無法檢查';
      results.checks.googleOAuth.details = {
        error: error.message,
      };
    }
  } else {
    results.checks.googleOAuth.status = 'error';
    results.checks.googleOAuth.message = 'Supabase 環境變數未設定';
  }

  // 3. 檢查 ElevenLabs API
  const elevenlabsKey = process.env.ELEVENLABS_API_KEY;
  results.checks.elevenlabs = {
    status: 'unknown',
    message: '',
    details: {},
  };

  if (!elevenlabsKey) {
    results.checks.elevenlabs.status = 'warning';
    results.checks.elevenlabs.message = 'API Key 未設定';
  } else {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: {
          'xi-api-key': elevenlabsKey,
        },
      });

      if (response.ok) {
        const data = await response.json();
        results.checks.elevenlabs.status = 'ok';
        results.checks.elevenlabs.message = 'API 連線正常';
        results.checks.elevenlabs.details = {
          keyPrefix: elevenlabsKey.substring(0, 10) + '...',
        };
      } else {
        results.checks.elevenlabs.status = 'error';
        results.checks.elevenlabs.message = `API 回應錯誤: ${response.status}`;
      }
    } catch (error: any) {
      results.checks.elevenlabs.status = 'error';
      results.checks.elevenlabs.message = '連線失敗';
      results.checks.elevenlabs.details = {
        error: error.message,
      };
    }
  }

  // 4. 檢查 Google Gemini API
  const googleApiKey = process.env.GOOGLE_API_KEY;
  results.checks.googleGemini = {
    status: 'unknown',
    message: '',
    details: {},
  };

  if (!googleApiKey) {
    results.checks.googleGemini.status = 'warning';
    results.checks.googleGemini.message = 'API Key 未設定';
  } else {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models?key=${googleApiKey}`
      );

      if (response.ok) {
        results.checks.googleGemini.status = 'ok';
        results.checks.googleGemini.message = 'API 連線正常';
        results.checks.googleGemini.details = {
          keyPrefix: googleApiKey.substring(0, 10) + '...',
        };
      } else {
        results.checks.googleGemini.status = 'error';
        results.checks.googleGemini.message = `API 回應錯誤: ${response.status}`;
      }
    } catch (error: any) {
      results.checks.googleGemini.status = 'error';
      results.checks.googleGemini.message = '連線失敗';
      results.checks.googleGemini.details = {
        error: error.message,
      };
    }
  }

  // 5. 檢查環境變數完整性
  results.checks.environment = {
    status: 'unknown',
    message: '',
    details: {},
    missing: [] as string[],
    present: [] as string[],
  };

  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SITE_URL',
  ];

  const optionalVars = [
    'ELEVENLABS_API_KEY',
    'ELEVENLABS_VOICE_ID',
    'GOOGLE_API_KEY',
  ];

  for (const varName of requiredVars) {
    if (process.env[varName]) {
      results.checks.environment.present.push(varName);
    } else {
      results.checks.environment.missing.push(varName);
    }
  }

  for (const varName of optionalVars) {
    if (process.env[varName]) {
      results.checks.environment.present.push(varName);
    } else {
      results.checks.environment.missing.push(varName);
    }
  }

  if (results.checks.environment.missing.length === 0) {
    results.checks.environment.status = 'ok';
    results.checks.environment.message = '所有環境變數已設定';
  } else if (results.checks.environment.missing.some((v: string) => requiredVars.includes(v))) {
    results.checks.environment.status = 'error';
    results.checks.environment.message = `缺少必要的環境變數: ${results.checks.environment.missing.filter((v: string) => requiredVars.includes(v)).join(', ')}`;
  } else {
    results.checks.environment.status = 'warning';
    results.checks.environment.message = '缺少部分可選環境變數';
  }

  // 計算總體狀態
  const statuses = Object.values(results.checks).map((check: any) => check.status);
  if (statuses.every((s) => s === 'ok')) {
    results.overall = 'ok';
  } else if (statuses.some((s) => s === 'error')) {
    results.overall = 'error';
  } else {
    results.overall = 'warning';
  }

  return NextResponse.json(results);
}

