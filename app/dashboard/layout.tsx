'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [nickname, setNickname] = useState<string>('');

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) {
          router.push('/login');
          return;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', authData.user.id)
          .single();

        if (!profile?.nickname) {
          router.push('/welcome');
          return;
        }

        setNickname(profile.nickname);
        setIsLoading(false);
      } catch (error) {
        console.error('[Dashboard] 認證檢查失敗:', error);
        router.push('/login');
      }
    }

    checkAuth();
  }, [supabase, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-purple-50">
        <div className="text-slate-600">載入中...</div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard/profile', label: '個人資料', icon: '👤' },
    { href: '/dashboard/bindings', label: '帳號綁定', icon: '🔗' },
    { href: '/dashboard/memory', label: '默契記憶', icon: '🧠' },
    { href: '/dashboard/history', label: '對話歷史', icon: '💬' },
    { href: '/dashboard/favorites', label: '收藏對話', icon: '⭐' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-800 mb-2">個人中心</h1>
              <p className="text-slate-600">嗨，{nickname} 👋</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 bg-white hover:bg-rose-50 text-slate-700 rounded-full shadow-md border border-white/20 transition-all text-sm font-medium"
            >
              ← 回到對話
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                          ${isActive
                            ? 'bg-rose-100 text-rose-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-50'
                          }
                        `}
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
