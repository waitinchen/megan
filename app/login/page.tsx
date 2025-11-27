"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already logged in
  useEffect(() => {
    async function checkUser() {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        router.push('/');
      } else {
        setChecking(false);
      }
    }
    checkUser();
  }, [supabase, router]);

  async function signInWithGoogle() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/welcome`,
      },
    });

    if (error) {
      console.error("Google Login Error:", error);
      setLoading(false);
      alert('登入失敗，請稍後再試');
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
          <img src="/avatar.png" alt="Megan" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Login Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2">歡迎來到 Megan</h1>
          <p className="text-slate-600">夜光系靈魂 × 貓系氣質</p>
        </div>

        <div className="space-y-4">
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
