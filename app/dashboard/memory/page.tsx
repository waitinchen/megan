'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/app/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { getUserMemories, type UserMemory } from '@/app/lib/memory/memory-service';

export default function MemoryPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string>('');
  const [memories, setMemories] = useState<UserMemory>({});
  const [stats, setStats] = useState({
    totalConversations: 0,
    relationshipScore: 0,
    lastConversation: null as string | null,
  });

  useEffect(() => {
    async function loadMemoryData() {
      try {
        const { data: authData } = await supabase.auth.getUser();

        if (!authData.user) return;

        setUserId(authData.user.id);

        // Load from Cloudflare KV
        const memoryData = await getUserMemories(authData.user.id);
        setMemories(memoryData);

        // Load stats from Supabase
        const { data: profile } = await supabase
          .from('profiles')
          .select('total_conversations, relationship_score, last_conversation_at')
          .eq('id', authData.user.id)
          .single();

        if (profile) {
          setStats({
            totalConversations: profile.total_conversations || 0,
            relationshipScore: profile.relationship_score || 0,
            lastConversation: profile.last_conversation_at
              ? new Date(profile.last_conversation_at).toLocaleDateString('zh-TW')
              : null,
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('[Memory] 載入失敗:', error);
        setIsLoading(false);
      }
    }

    loadMemoryData();
  }, [supabase]);

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
        <p className="text-slate-600">載入中...</p>
      </div>
    );
  }

  const hasMemories = Object.keys(memories).length > 0 &&
    (memories.profile || memories.preferences || memories.relationship || memories.longterm);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="text-sm text-slate-600 mb-1">對話次數</div>
          <div className="text-3xl font-bold text-slate-800">
            {stats.totalConversations}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="text-sm text-slate-600 mb-1">默契指數</div>
          <div className="text-3xl font-bold text-rose-600">
            {stats.relationshipScore}/100
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
          <div className="text-sm text-slate-600 mb-1">最後對話</div>
          <div className="text-lg font-semibold text-slate-800">
            {stats.lastConversation || '尚未對話'}
          </div>
        </div>
      </div>

      {/* Memory Sections */}
      {!hasMemories ? (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-12 text-center">
          <div className="text-6xl mb-4">🧠</div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            還沒有記憶
          </h3>
          <p className="text-slate-600 mb-6">
            與 Megan 多聊聊，她會逐漸記住你的喜好和習慣
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-all"
          >
            開始對話 →
          </a>
        </div>
      ) : (
        <>
          {/* Profile Summary */}
          {memories.profile && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span>👤</span>
                <span>性格推論</span>
              </h2>

              <div className="space-y-4">
                {memories.profile.personality_summary && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">性格特徵</div>
                    <div className="text-slate-600">{memories.profile.personality_summary}</div>
                  </div>
                )}

                {memories.profile.emotion_patterns && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">情緒模式</div>
                    <div className="text-slate-600">{memories.profile.emotion_patterns}</div>
                  </div>
                )}

                <div className="flex gap-4 flex-wrap">
                  {memories.profile.estimated_age && (
                    <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      約 {memories.profile.estimated_age} 歲
                    </div>
                  )}
                  {memories.profile.estimated_gender && (
                    <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm">
                      {memories.profile.estimated_gender}
                    </div>
                  )}
                  {memories.profile.estimated_occupation && (
                    <div className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                      {memories.profile.estimated_occupation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preferences */}
          {memories.preferences && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span>⚙️</span>
                <span>偏好設定</span>
              </h2>

              <div className="space-y-4">
                {memories.preferences.preferred_tone && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">喜歡的語氣</div>
                    <div className="text-slate-600">{memories.preferences.preferred_tone}</div>
                  </div>
                )}

                {memories.preferences.chat_pace && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-1">對話節奏</div>
                    <div className="text-slate-600 capitalize">{memories.preferences.chat_pace}</div>
                  </div>
                )}

                {memories.preferences.avoid_topics && memories.preferences.avoid_topics.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">避免的話題</div>
                    <div className="flex gap-2 flex-wrap">
                      {memories.preferences.avoid_topics.map((topic, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                        >
                          🚫 {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {memories.preferences.common_words && memories.preferences.common_words.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">常用詞彙</div>
                    <div className="flex gap-2 flex-wrap">
                      {memories.preferences.common_words.map((word, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-sm"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Relationship */}
          {memories.relationship && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span>❤️</span>
                <span>關係狀態</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {memories.relationship.bond_level && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">默契等級</div>
                    <div className="text-4xl font-bold text-rose-600">
                      {memories.relationship.bond_level}
                    </div>
                  </div>
                )}

                {memories.relationship.dependency_pattern && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">依賴模式</div>
                    <div className="text-slate-600">{memories.relationship.dependency_pattern}</div>
                  </div>
                )}

                {memories.relationship.trust_level !== undefined && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">信任程度</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                          style={{ width: `${memories.relationship.trust_level}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {memories.relationship.trust_level}/100
                      </span>
                    </div>
                  </div>
                )}

                {memories.relationship.intimacy_level !== undefined && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">親密程度</div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-rose-400 to-rose-600 rounded-full transition-all"
                          style={{ width: `${memories.relationship.intimacy_level}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        {memories.relationship.intimacy_level}/100
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Long-term Memories */}
          {memories.longterm && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <span>📚</span>
                <span>長期記憶</span>
              </h2>

              <div className="space-y-6">
                {memories.longterm.important_events && memories.longterm.important_events.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-3">重要時刻</div>
                    <div className="space-y-2">
                      {memories.longterm.important_events.map((event, index) => (
                        <div key={index} className="flex gap-3 items-start">
                          <div className="text-2xl">
                            {event.importance >= 8 ? '⭐' : event.importance >= 5 ? '✨' : '💫'}
                          </div>
                          <div className="flex-1">
                            <div className="text-sm text-slate-500">{event.date}</div>
                            <div className="text-slate-700">{event.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {memories.longterm.key_memories && memories.longterm.key_memories.length > 0 && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-3">關鍵記憶</div>
                    <ul className="space-y-2">
                      {memories.longterm.key_memories.map((memory, index) => (
                        <li key={index} className="flex gap-2 items-start">
                          <span className="text-rose-500 mt-1">•</span>
                          <span className="text-slate-700">{memory}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {memories.longterm.growth_journey && (
                  <div>
                    <div className="text-sm font-medium text-slate-700 mb-2">成長歷程</div>
                    <div className="text-slate-600 leading-relaxed">
                      {memories.longterm.growth_journey}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Refresh Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm text-blue-800">
          💡 記憶會在每次對話後自動更新，反映你與 Megan 的最新互動
        </p>
      </div>
    </div>
  );
}
