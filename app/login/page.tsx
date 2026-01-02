"use client";

import { createClient } from '@/app/utils/supabase/client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginWithWeChatButton } from '@/components/auth/LoginWithWeChat';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [guestUsername, setGuestUsername] = useState('');
  const [guestPassword, setGuestPassword] = useState('');
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState('');

  // Check if already logged in
  useEffect(() => {
    let mounted = true;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let checkCompleted = false;

    // 立即设置超时，确保即使 getUser() 挂起也能退出
    timeoutId = setTimeout(() => {
      if (mounted && !checkCompleted) {
        console.warn('[Login] Check timeout (1.5s), showing login form');
        checkCompleted = true;
        setChecking(false);
      }
    }, 1500); // 1.5 秒超时

    async function checkUser() {
      try {
        const supabase = createClient();
        const result = await supabase.auth.getUser();

        if (!mounted || checkCompleted) return;

        // 清除超时
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        checkCompleted = true;

        const { data, error } = result;

        if (error) {
          console.log('[Login] No user session:', error.message);
          setChecking(false);
          return;
        }

        if (data?.user) {
          console.log('[Login] User found, redirecting...');
          router.push('/');
        } else {
          console.log('[Login] No user, showing login form');
          setChecking(false);
        }
      } catch (error: any) {
        if (!mounted || checkCompleted) return;

        console.error('[Login] Error checking user:', error?.message || error);

        // 清除超时
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        checkCompleted = true;
        setChecking(false);
      }
    }

    // 立即执行检查
    checkUser();

    return () => {
      mounted = false;
      checkCompleted = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [router]);

  async function signInWithGoogle() {
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Google Login Error:", error);
      setLoading(false);

      // 提供更詳細的錯誤訊息
      let errorMessage = '登入失敗，請稍後再試';

      if (error.message?.includes('invalid_client') || error.message?.includes('401')) {
        errorMessage = 'OAuth 設定錯誤：請檢查 Supabase Dashboard 中的 Google Provider 設定\n\n' +
          '常見問題：\n' +
          '1. Client ID 不完整或不正確\n' +
          '2. Client Secret 與 Google Cloud Console 不匹配\n' +
          '3. 請參考 FINAL_FIX_INVALID_CLIENT.md 進行檢查';
      }

      alert(errorMessage);
    }
  }

  async function handleGuestLogin(e: React.FormEvent) {
    e.preventDefault();
    setGuestError('');
    setGuestLoading(true);

    try {
      const response = await fetch('/api/auth/guest-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: guestUsername,
          password: guestPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGuestError(data.error || '登入失敗');
        setGuestLoading(false);
        return;
      }

      // 儲存訪客 session 到 localStorage
      localStorage.setItem('guest_session', JSON.stringify({
        userId: data.user.id,
        nickname: data.user.nickname,
        isGuest: true,
      }));

      console.log('[Guest Login] 訪客登入成功');

      // 跳轉到主頁
      router.push('/');
    } catch (error: any) {
      console.error('[Guest Login] Error:', error);
      setGuestError('登入失敗，請稍後再試');
      setGuestLoading(false);
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">檢查登入狀態...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50 px-6">
      {/* Megan Avatar */}
      <div className="mb-8">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl">
          <img src="/avatar.png" alt="心菲" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">我是心菲 !</h1>
          <p className="text-slate-600">夜靈魂 × 貓氣質</p>
        </div>

        <div className="space-y-4">
          {/* 訪客登入表單 */}
          <form onSubmit={handleGuestLogin} className="space-y-3">
            <div className="text-left">
              <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-1">
                帳號
              </label>
              <input
                id="username"
                type="text"
                value={guestUsername}
                onChange={(e) => setGuestUsername(e.target.value)}
                placeholder="test"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 transition-colors text-slate-700"
                disabled={guestLoading}
              />
            </div>

            <div className="text-left">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                密碼
              </label>
              <input
                id="password"
                type="password"
                value={guestPassword}
                onChange={(e) => setGuestPassword(e.target.value)}
                placeholder="test1234"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-rose-400 transition-colors text-slate-700"
                disabled={guestLoading}
              />
            </div>

            {guestError && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {guestError}
              </div>
            )}

            <button
              type="submit"
              disabled={guestLoading}
              className="w-full px-6 py-4 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-xl shadow-md hover:shadow-lg hover:from-rose-500 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
            >
              {guestLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  登入中...
                </>
              ) : (
                <>
                  🎮 訪客登入
                </>
              )}
            </button>
          </form>

          {/* 分隔線 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">或</span>
            </div>
          </div>
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full px-6 py-4 bg-white text-slate-700 border-2 border-slate-200 rounded-xl shadow-md hover:shadow-lg hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-medium"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                登入中...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                使用 Google 登入
              </>
            )}
          </button>

          {/* 微信登入按鈕 */}
          <LoginWithWeChatButton />
        </div>

        <p className="text-xs text-slate-500">
          登入即表示你同意我們的服務條款與隱私政策
        </p>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">Superintelligence © 2025. All Rights Reserved.</p>
      </div>
    </div>
  );
}
