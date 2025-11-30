'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { LoginWithWeChatButton } from '@/components/auth/LoginWithWeChat';

interface Provider {
  id: string;
  name: string;
  icon: string;
  color: string;
  isBound: boolean;
}

export default function BindingsPage() {
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [providers, setProviders] = useState<Provider[]>([
    { id: 'google', name: 'Google', icon: '🔵', color: 'blue', isBound: false },
    { id: 'line', name: 'LINE', icon: '🟢', color: 'green', isBound: false },
    { id: 'wechat', name: 'WeChat', icon: '🟢', color: 'green', isBound: false },
  ]);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadBindings() {
      try {
        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) return;

        // Check which providers are linked
        const linkedProviders = authData.user.identities?.map(identity => identity.provider) || [];

        setProviders(prev => prev.map(provider => ({
          ...provider,
          isBound: linkedProviders.includes(provider.id)
        })));

        setIsLoading(false);
      } catch (error) {
        console.error('[Bindings] 載入失敗:', error);
        setIsLoading(false);
      }
    }

    loadBindings();
  }, [supabase]);

  const handleBind = async (providerId: string) => {
    setMessage(null);

    try {
      if (providerId === 'google') {
        // OAuth linking for Google
        const { error } = await supabase.auth.linkIdentity({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/dashboard/bindings`,
          },
        });

        if (error) throw error;
      } else {
        // LINE and WeChat - not yet implemented
        setMessage({
          type: 'error',
          text: `${providerId.toUpperCase()} 綁定功能開發中，敬請期待`
        });
      }
    } catch (error: any) {
      console.error(`[Bindings] ${providerId} 綁定失敗:`, error);
      setMessage({
        type: 'error',
        text: `綁定失敗: ${error.message}`
      });
    }
  };

  const handleUnbind = async (providerId: string) => {
    setMessage(null);

    // Prevent unbinding the last provider
    const boundCount = providers.filter(p => p.isBound).length;
    if (boundCount <= 1) {
      setMessage({
        type: 'error',
        text: '至少需要保留一個登入方式'
      });
      return;
    }

    try {
      if (providerId === 'google') {
        const { data: authData } = await supabase.auth.getUser();
        const identity = authData.user?.identities?.find(id => id.provider === 'google');

        if (!identity) {
          throw new Error('找不到綁定資訊');
        }

        const { error } = await supabase.auth.unlinkIdentity(identity);

        if (error) throw error;

        setProviders(prev => prev.map(provider =>
          provider.id === providerId ? { ...provider, isBound: false } : provider
        ));

        setMessage({ type: 'success', text: `已解除 ${providerId.toUpperCase()} 綁定` });
      } else {
        setMessage({
          type: 'error',
          text: `${providerId.toUpperCase()} 解除綁定功能開發中`
        });
      }
    } catch (error: any) {
      console.error(`[Bindings] ${providerId} 解除綁定失敗:`, error);
      setMessage({
        type: 'error',
        text: `解除綁定失敗: ${error.message}`
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
        <p className="text-slate-600">載入中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">第三方帳號綁定</h2>
        <p className="text-slate-600 text-sm">
          綁定多個帳號，方便你隨時登入 Megan
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Providers List */}
      <div className="space-y-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">{provider.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-800">
                    {provider.name}
                  </h3>
                  <p className="text-sm text-slate-600">
                    {provider.isBound ? (
                      <span className="text-green-600">✓ 已綁定</span>
                    ) : (
                      <span className="text-slate-400">未綁定</span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                {provider.isBound ? (
                  <button
                    onClick={() => handleUnbind(provider.id)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition-all border border-red-200"
                  >
                    解除綁定
                  </button>
                ) : (
                  provider.id === 'wechat' ? (
                    <LoginWithWeChatButton 
                      variant="compact" 
                      text="綁定（開發中）"
                    />
                  ) : (
                    <button
                      onClick={() => handleBind(provider.id)}
                      className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all"
                    >
                      綁定
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Warning Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          ⚠️ 提醒：請至少保留一個登入方式，避免無法登入帳號
        </p>
      </div>
    </div>
  );
}
