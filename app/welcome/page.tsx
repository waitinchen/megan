"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function Welcome() {
  const supabase = createClient();
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check if already has nickname → redirect to home
  useEffect(() => {
    async function loadProfile() {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", data.user.id)
        .single();

      if (profile?.nickname) {
        router.push("/");
      } else {
        setChecking(false);
      }
    }

    loadProfile();
  }, [supabase, router]);

  const saveNickname = async () => {
    if (!nickname.trim()) return;

    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        nickname: nickname.trim(),
      });

    setLoading(false);

    if (!error) {
      router.push("/");
    } else {
      console.error('保存暱稱失敗:', error);
      alert('保存失敗，請稍後再試');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && nickname.trim() && !loading) {
      saveNickname();
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50">
      {/* Megan Avatar */}
      <div className="mb-8">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-xl">
          <img src="/avatar.png" alt="心菲" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* Nickname Input Card */}
      <div className="bg-white/80 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 mb-2">
            嗨，我是 Megan 🌙
          </h1>
          <p className="text-slate-600">
            我該怎麼稱呼你呢？
          </p>
        </div>

        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="輸入你的暱稱或小名"
          className="w-full px-4 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-300 transition-all"
          autoFocus
          maxLength={20}
        />

        <button
          onClick={saveNickname}
          disabled={!nickname.trim() || loading}
          className="w-full py-3 rounded-xl bg-rose-400 hover:bg-rose-500 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-400"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              保存中...
            </span>
          ) : (
            "開始與 Megan 對話"
          )}
        </button>

        <p className="text-xs text-slate-500">
          你隨時可以在設定中更改暱稱
        </p>
      </div>
    </div>
  );
}
