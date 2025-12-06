'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, LogOut } from 'lucide-react';

const ADMIN_EMAIL = 'waitinchen@gmail.com';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = createClient();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        async function checkAdmin() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user || user.email !== ADMIN_EMAIL) {
                    console.log('[Admin] 未授權訪問,重定向到首頁');
                    // 立即重定向
                    window.location.href = '/';
                    return;
                }

                setUserEmail(user.email);
                setIsLoading(false);
            } catch (error) {
                console.error('[Admin] 認證檢查失敗:', error);
                // 立即重定向
                window.location.href = '/';
            }
        }

        checkAdmin();
    }, [supabase]);

    async function handleLogout() {
        await supabase.auth.signOut();
        window.location.href = '/';
    }

    // 如果正在載入或非管理員,顯示載入畫面
    if (isLoading || !userEmail) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-slate-600">驗證管理員權限...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <Shield className="text-rose-600" size={28} />
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">Megan 管理後台</h1>
                                <p className="text-xs text-slate-500">系統監控與用戶管理</p>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <div className="text-sm font-medium text-slate-700">管理員</div>
                                <div className="text-xs text-slate-500">{userEmail}</div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="登出"
                            >
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-6 h-12">
                        <Link
                            href="/admin"
                            className="flex items-center px-3 border-b-2 border-rose-500 text-rose-600 font-medium text-sm"
                        >
                            總覽
                        </Link>
                        <Link
                            href="/admin/personality"
                            className="flex items-center px-3 border-b-2 border-transparent hover:border-rose-300 hover:text-rose-600 text-slate-600 font-medium text-sm transition-colors"
                        >
                            人格
                        </Link>
                        <Link
                            href="/admin/knowledge"
                            className="flex items-center px-3 border-b-2 border-transparent hover:border-rose-300 hover:text-rose-600 text-slate-600 font-medium text-sm transition-colors"
                        >
                            知識
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-slate-200 mt-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <p className="text-center text-xs text-slate-500">
                        Megan Admin Dashboard © 2025
                    </p>
                </div>
            </footer>
        </div>
    );
}
