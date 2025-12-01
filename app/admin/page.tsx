'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, MessageSquare, TrendingUp, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface Stats {
    totalUsers: number;
    activeUsers: number;
    totalConversations: number;
    totalMessages: number;
    avgMessageCount: number;
    newUsersToday: number;
    conversationsToday: number;
}

interface User {
    id: string;
    email: string;
    nickname: string | null;
    avatar_url: string | null;
    total_conversations: number;
    relationship_score: number;
    last_conversation_at: string | null;
    created_at: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function AdminPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [pagination.page, searchQuery]);

    async function loadStats() {
        try {
            const response = await fetch('/api/admin/stats');
            const result = await response.json();
            if (result.success && result.data) {
                setStats(result.data.stats);
            }
        } catch (error) {
            console.error('[Admin] 載入統計失敗:', error);
        }
    }

    async function loadUsers() {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
                ...(searchQuery && { search: searchQuery }),
            });

            const response = await fetch(`/api/admin/users?${params}`);
            const result = await response.json();

            if (result.success && result.data) {
                setUsers(result.data.users);
                setPagination(result.data.pagination);
            }
        } catch (error) {
            console.error('[Admin] 載入用戶失敗:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return '從未';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        setPagination(prev => ({ ...prev, page: 1 }));
    }

    return (
        <div className="space-y-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="總用戶"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="text-blue-600" size={24} />}
                    bgColor="bg-blue-50"
                    subtitle={`今日新增 ${stats?.newUsersToday || 0}`}
                />
                <StatCard
                    title="活躍用戶"
                    value={stats?.activeUsers || 0}
                    icon={<Activity className="text-green-600" size={24} />}
                    bgColor="bg-green-50"
                    subtitle="最近 7 天"
                />
                <StatCard
                    title="總對話"
                    value={stats?.totalConversations || 0}
                    icon={<MessageSquare className="text-purple-600" size={24} />}
                    bgColor="bg-purple-50"
                    subtitle={`今日 ${stats?.conversationsToday || 0}`}
                />
                <StatCard
                    title="總訊息"
                    value={stats?.totalMessages || 0}
                    icon={<TrendingUp className="text-rose-600" size={24} />}
                    bgColor="bg-rose-50"
                    subtitle={`平均 ${stats?.avgMessageCount || 0} 則/對話`}
                />
            </div>

            {/* User List */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">用戶列表</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            共 {pagination.total} 位用戶
                        </p>
                    </div>

                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="搜尋 email 或暱稱..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent w-64"
                        />
                    </form>
                </div>

                {/* Table */}
                {isLoading ? (
                    <div className="text-center py-12 text-slate-500">載入中...</div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">沒有找到用戶</div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200">
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">Email</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">暱稱</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">對話次數</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">默契指數</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">最後活躍</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-slate-700">註冊時間</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-slate-700">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 text-sm text-slate-700">{user.email}</td>
                                            <td className="py-3 px-4 text-sm text-slate-700">{user.nickname || '-'}</td>
                                            <td className="py-3 px-4 text-sm text-center text-slate-700">{user.total_conversations}</td>
                                            <td className="py-3 px-4 text-sm text-center">
                                                <span className={`inline-block px-2 py-1 rounded ${user.relationship_score >= 70 ? 'bg-green-100 text-green-700' :
                                                        user.relationship_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-slate-100 text-slate-700'
                                                    }`}>
                                                    {user.relationship_score}/100
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-slate-700">{formatDate(user.last_conversation_at)}</td>
                                            <td className="py-3 px-4 text-sm text-slate-500">{formatDate(user.created_at)}</td>
                                            <td className="py-3 px-4 text-center">
                                                <Link
                                                    href={`/admin/${user.id}`}
                                                    className="text-rose-600 hover:text-rose-700 font-medium text-sm"
                                                >
                                                    查看
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-between mt-6">
                            <div className="text-sm text-slate-600">
                                顯示 {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / 共 {pagination.total} 位用戶
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={pagination.page === 1}
                                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                <span className="text-sm text-slate-700 px-4">
                                    第 {pagination.page} / {pagination.totalPages} 頁
                                </span>
                                <button
                                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={pagination.page >= pagination.totalPages}
                                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    icon,
    bgColor,
    subtitle,
}: {
    title: string;
    value: number;
    icon: React.ReactNode;
    bgColor: string;
    subtitle?: string;
}) {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${bgColor}`}>
                    {icon}
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-800 mb-1">
                {value.toLocaleString()}
            </div>
            <div className="text-sm text-slate-600">{title}</div>
            {subtitle && (
                <div className="text-xs text-slate-500 mt-2">{subtitle}</div>
            )}
        </div>
    );
}
