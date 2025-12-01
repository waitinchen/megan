'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, User, Mail, Calendar, MessageSquare, Heart, TrendingUp } from 'lucide-react';

interface UserDetail {
    id: string;
    email: string;
    nickname: string | null;
    avatar_url: string | null;
    total_conversations: number;
    relationship_score: number;
    last_conversation_at: string | null;
    created_at: string;
}

interface Conversation {
    id: string;
    title: string | null;
    preview: string;
    message_count: number;
    created_at: string;
    ended_at: string | null;
}

interface Favorite {
    id: string;
    message_content: string;
    created_at: string;
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const [user, setUser] = useState<UserDetail | null>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [favorites, setFavorites] = useState<Favorite[]>([]);
    const [stats, setStats] = useState({ totalMessages: 0, totalConversations: 0, totalFavorites: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function unwrapParams() {
            const { id } = await params;
            setUserId(id);
        }
        unwrapParams();
    }, []);

    useEffect(() => {
        if (userId) {
            loadUserDetail();
        }
    }, [userId]);

    async function loadUserDetail() {
        if (!userId) return;

        try {
            setIsLoading(true);
            const response = await fetch(`/api/admin/users/${userId}`);
            const result = await response.json();

            if (result.success && result.data) {
                setUser(result.data.user);
                setConversations(result.data.conversations);
                setFavorites(result.data.favorites);
                setStats(result.data.stats);
            }
        } catch (error) {
            console.error('[Admin] 載入用戶詳情失敗:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function formatDate(dateString: string | null) {
        if (!dateString) return '從未';
        const date = new Date(dateString);
        return date.toLocaleString('zh-TW', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-slate-600">載入中...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="text-center py-12">
                <div className="text-slate-600 mb-4">用戶不存在</div>
                <Link href="/admin" className="text-rose-600 hover:text-rose-700">
                    返回列表
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Back Button */}
            <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
            >
                <ArrowLeft size={20} />
                返回用戶列表
            </Link>

            {/* User Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                        {user.nickname?.[0] || user.email[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-slate-800 mb-2">
                            {user.nickname || '未設置暱稱'}
                        </h1>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Mail size={16} />
                                {user.email}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar size={16} />
                                註冊於 {formatDate(user.created_at)}
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <MessageSquare size={16} />
                                {user.total_conversations} 次對話
                            </div>
                            <div className="flex items-center gap-2 text-slate-600">
                                <TrendingUp size={16} />
                                默契指數 {user.relationship_score}/100
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow border border-slate-200 p-4">
                    <div className="text-sm text-slate-600 mb-1">總對話數</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.totalConversations}</div>
                </div>
                <div className="bg-white rounded-xl shadow border border-slate-200 p-4">
                    <div className="text-sm text-slate-600 mb-1">總訊息數</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.totalMessages}</div>
                </div>
                <div className="bg-white rounded-xl shadow border border-slate-200 p-4">
                    <div className="text-sm text-slate-600 mb-1">收藏數</div>
                    <div className="text-2xl font-bold text-slate-800">{stats.totalFavorites}</div>
                </div>
            </div>

            {/* Conversations */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">最近對話</h2>
                {conversations.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">尚無對話記錄</div>
                ) : (
                    <div className="space-y-3">
                        {conversations.map((conv) => (
                            <div key={conv.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="font-medium text-slate-800 mb-1">
                                            {conv.title || '無標題對話'}
                                        </div>
                                        <div className="text-sm text-slate-600 line-clamp-2 mb-2">
                                            {conv.preview}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                            <span>{conv.message_count} 則訊息</span>
                                            <span>{formatDate(conv.created_at)}</span>
                                            {conv.ended_at && <span>已結束</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Favorites */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-4">收藏內容</h2>
                {favorites.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">尚無收藏</div>
                ) : (
                    <div className="space-y-3">
                        {favorites.map((fav) => (
                            <div key={fav.id} className="border border-slate-200 rounded-lg p-4">
                                <div className="text-sm text-slate-700 mb-2">{fav.message_content}</div>
                                <div className="text-xs text-slate-500">{formatDate(fav.created_at)}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
