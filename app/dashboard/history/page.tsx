'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Trash2, MessageSquare, Clock } from 'lucide-react';

interface Conversation {
  id: string;
  title: string | null;
  preview: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
}

export default function HistoryPage() {
  const supabase = createClient();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  async function loadConversations() {
    try {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        router.push('/login');
        return;
      }

      setIsLoading(true);
      const response = await fetch('/api/conversations');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '載入失敗');
      }

      // API 使用統一響應格式: { success: true, data: { conversations: [...] } }
      setConversations(result.data?.conversations || []);
      setIsLoading(false);
    } catch (error: any) {
      console.error('[History] 載入失敗:', error);
      setMessage({ type: 'error', text: `載入失敗: ${error.message}` });
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string, title: string | null) {
    if (!confirm(`確定要刪除這個對話嗎？${title ? `\n標題：${title}` : ''}`)) return;

    try {
      const response = await fetch(`/api/conversations?id=${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '刪除失敗');
      }

      setConversations(prev => prev.filter(conv => conv.id !== id));
      setMessage({ type: 'success', text: '已刪除對話' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('[History] 刪除失敗:', error);
      setMessage({ type: 'error', text: `刪除失敗: ${error.message}` });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return `今天 ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days === 1) {
      return `昨天 ${date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (days < 7) {
      return `${days} 天前`;
    } else {
      return date.toLocaleDateString('zh-TW', { year: 'numeric', month: 'short', day: 'numeric' });
    }
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (conv.title && conv.title.toLowerCase().includes(query)) ||
      conv.preview?.toLowerCase().includes(query)
    );
  });

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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-1">對話歷史</h2>
            <p className="text-slate-600 text-sm">
              查看和管理你與 Megan 的所有對話
            </p>
          </div>

          <div className="text-3xl font-bold text-rose-600">
            {conversations.length}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="搜尋對話..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Empty State */}
      {filteredConversations.length === 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            {searchQuery ? '沒有找到相關對話' : '還沒有對話記錄'}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchQuery
              ? '試試其他關鍵字'
              : '開始與 Megan 對話，記錄會自動保存'}
          </p>
          {!searchQuery && (
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all"
            >
              開始對話 →
            </Link>
          )}
        </div>
      )}

      {/* Conversations List */}
      <div className="space-y-4">
        {filteredConversations.map((conversation) => (
          <div
            key={conversation.id}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <Link
                href={`/?conversation=${conversation.id}`}
                className="flex-1 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="text-rose-500" size={20} />
                  <h3 className="font-semibold text-slate-800">
                    {conversation.title || '無標題對話'}
                  </h3>
                </div>

                <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                  {conversation.preview || '（無預覽）'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    <span>{conversation.message_count} 則訊息</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{formatDate(conversation.last_message_at)}</span>
                  </div>
                </div>
              </Link>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleDelete(conversation.id, conversation.title)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="刪除對話"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

