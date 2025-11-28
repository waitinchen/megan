'use client';

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Search, ArrowUpDown } from 'lucide-react';

interface Favorite {
  id: string;
  type: 'text' | 'audio';
  content: string;
  audio_url?: string;
  created_at: string;
}

export default function FavoritesPage() {
  const supabase = createClientComponentClient();
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [filter, setFilter] = useState<'all' | 'text' | 'audio'>('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = 最新在前, asc = 最舊在前

  useEffect(() => {
    loadFavorites();
  }, [sortOrder]);

  // 當搜尋關鍵字改變時，延遲搜尋（防抖）
  useEffect(() => {
    const timer = setTimeout(() => {
      loadFavorites();
    }, 500); // 500ms 延遲

    return () => clearTimeout(timer);
  }, [searchQuery]);

  async function loadFavorites() {
    try {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) return;

      setIsLoading(true);

      // 構建 API URL
      const params = new URLSearchParams();
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      params.append('sort', sortOrder);

      const response = await fetch(`/api/favorites?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '載入失敗');
      }

      setFavorites(result.favorites || []);
      setIsLoading(false);
    } catch (error: any) {
      console.error('[Favorites] 載入失敗:', error);
      setMessage({ type: 'error', text: `載入失敗: ${error.message}` });
      setIsLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('確定要刪除這個收藏嗎？')) return;

    try {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavorites(prev => prev.filter(fav => fav.id !== id));
      setMessage({ type: 'success', text: '已刪除收藏' });
      // 3 秒後清除訊息
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('[Favorites] 刪除失敗:', error);
      setMessage({ type: 'error', text: `刪除失敗: ${error.message}` });
      setTimeout(() => setMessage(null), 3000);
    }
  }

  const filteredFavorites = favorites.filter(fav =>
    filter === 'all' ? true : fav.type === filter
  );

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
            <h2 className="text-2xl font-bold text-slate-800 mb-1">收藏對話</h2>
            <p className="text-slate-600 text-sm">
              保存你與 Megan 的經典時刻
            </p>
          </div>

          <div className="text-3xl font-bold text-rose-600">
            {favorites.length}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="搜尋收藏內容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
          />
        </div>

        {/* Filter & Sort */}
        <div className="flex gap-2 items-center justify-between flex-wrap">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'all'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              全部 ({favorites.length})
            </button>
            <button
              onClick={() => setFilter('text')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'text'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              文字 ({favorites.filter(f => f.type === 'text').length})
            </button>
            <button
              onClick={() => setFilter('audio')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === 'audio'
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              語音 ({favorites.filter(f => f.type === 'audio').length})
            </button>
          </div>

          {/* Sort Toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all font-medium"
            title={sortOrder === 'desc' ? '切換為最舊優先' : '切換為最新優先'}
          >
            <ArrowUpDown size={16} />
            <span>{sortOrder === 'desc' ? '最新' : '最舊'}</span>
          </button>
        </div>
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

      {/* Empty State */}
      {filteredFavorites.length === 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            {filter === 'all' ? '還沒有收藏' : `沒有${filter === 'text' ? '文字' : '語音'}收藏`}
          </h3>
          <p className="text-slate-600 mb-6">
            在對話中點擊 ⭐ 按鈕來收藏精彩片段
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all"
          >
            回到對話 →
          </a>
        </div>
      )}

      {/* Favorites List */}
      <div className="space-y-4">
        {filteredFavorites.map((favorite) => (
          <div
            key={favorite.id}
            className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                {/* Type Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">
                    {favorite.type === 'text' ? '💬' : '🎤'}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(favorite.created_at).toLocaleString('zh-TW')}
                  </span>
                </div>

                {/* Content */}
                <div className="text-slate-700 leading-relaxed mb-3">
                  {favorite.content}
                </div>

                {/* Audio Player */}
                {favorite.type === 'audio' && favorite.audio_url && (
                  <div className="mt-3">
                    <audio
                      controls
                      className="w-full max-w-md"
                      src={favorite.audio_url}
                    >
                      您的瀏覽器不支援音頻播放
                    </audio>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleDelete(favorite.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="刪除"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          💡 提示：未來將支持從對話頁面直接收藏訊息和語音
        </p>
      </div>
    </div>
  );
}
