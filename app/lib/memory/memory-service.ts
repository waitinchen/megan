/**
 * Memory Service - 與 Cloudflare Worker (Tone Memory Core API) 通信
 *
 * 這個服務負責：
 * 1. 從 KV 讀取用戶記憶
 * 2. 更新用戶記憶到 KV
 * 3. 將記憶注入到對話 Context
 */

const MEMORY_API_URL = process.env.NEXT_PUBLIC_MEMORY_API_URL || 'https://tone-memory-core-1.waitin-chen.workers.dev';

export interface UserMemory {
  profile?: {
    personality_summary?: string;
    emotion_patterns?: string;
    estimated_age?: number;
    estimated_gender?: string;
    estimated_occupation?: string;
  };
  preferences?: {
    preferred_tone?: string;
    avoid_topics?: string[];
    chat_pace?: string; // fast / slow / balanced
    common_words?: string[];
  };
  relationship?: {
    bond_level?: string; // SSS / S / A / B / C
    dependency_pattern?: string;
    trust_level?: number; // 0-100
    intimacy_level?: number; // 0-100
  };
  longterm?: {
    important_events?: Array<{
      date: string;
      description: string;
      importance: number;
    }>;
    key_memories?: string[];
    growth_journey?: string;
  };
}

/**
 * 從 KV 獲取用戶的所有記憶
 */
export async function getUserMemories(userId: string): Promise<UserMemory> {
  try {
    const key = `megan:${userId}`;
    const response = await fetch(`${MEMORY_API_URL}/memory?key=${encodeURIComponent(key)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Memory Service] 獲取記憶失敗: ${response.statusText}`);
      return {};
    }

    const text = await response.text();

    // 處理 Worker 返回 "(沒有資料)" 的情況
    if (text === '(沒有資料)' || !text || text.trim() === '') {
      console.log(`[Memory Service] 用戶 ${userId} 無記憶數據，使用空對象`);
      return {};
    }

    try {
      const data = JSON.parse(text);
      return data as UserMemory;
    } catch (parseError) {
      console.error('[Memory Service] JSON 解析失敗:', text);
      return {};
    }
  } catch (error) {
    console.error('[Memory Service] 獲取記憶錯誤:', error);
    return {};
  }
}

/**
 * 更新用戶的特定記憶
 */
export async function updateUserMemory(
  userId: string,
  key: 'profile' | 'preferences' | 'relationship' | 'longterm',
  value: any
): Promise<boolean> {
  try {
    // 先獲取現有記憶
    const currentMemories = await getUserMemories(userId);

    // 更新指定的 key
    const updatedMemories = {
      ...currentMemories,
      [key]: value,
    };

    // 保存回 KV
    const key = `megan:${userId}`;
    const response = await fetch(`${MEMORY_API_URL}/memory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        key,
        value: updatedMemories,
      }),
    });

    if (!response.ok) {
      console.error(`[Memory Service] 更新記憶失敗: ${response.statusText}`);
      return false;
    }

    console.log(`[Memory Service] 記憶已更新: ${key}`);
    return true;
  } catch (error) {
    console.error('[Memory Service] 更新記憶錯誤:', error);
    return false;
  }
}

/**
 * 構建記憶 Context（用於注入到 LLM Prompt）
 */
export function buildMemoryContext(
  nickname: string,
  memories: UserMemory
): string {
  const sections: string[] = [];

  // 基本資料
  if (memories.profile) {
    const profile = memories.profile;
    let profileText = `## 關於 ${nickname}\n\n`;

    if (profile.personality_summary) {
      profileText += `**性格特徵**: ${profile.personality_summary}\n\n`;
    }

    if (profile.emotion_patterns) {
      profileText += `**情緒模式**: ${profile.emotion_patterns}\n\n`;
    }

    if (profile.estimated_age || profile.estimated_gender || profile.estimated_occupation) {
      const details = [];
      if (profile.estimated_age) details.push(`年齡約 ${profile.estimated_age} 歲`);
      if (profile.estimated_gender) details.push(profile.estimated_gender);
      if (profile.estimated_occupation) details.push(`職業：${profile.estimated_occupation}`);
      profileText += `**基本推測**: ${details.join('、')}\n\n`;
    }

    sections.push(profileText);
  }

  // 偏好
  if (memories.preferences) {
    const prefs = memories.preferences;
    let prefsText = `## ${nickname} 的偏好\n\n`;

    if (prefs.preferred_tone) {
      prefsText += `- **喜歡的語氣**: ${prefs.preferred_tone}\n`;
    }

    if (prefs.avoid_topics && prefs.avoid_topics.length > 0) {
      prefsText += `- **避免的話題**: ${prefs.avoid_topics.join('、')}\n`;
    }

    if (prefs.chat_pace) {
      prefsText += `- **對話節奏**: ${prefs.chat_pace}\n`;
    }

    if (prefs.common_words && prefs.common_words.length > 0) {
      prefsText += `- **常用詞彙**: ${prefs.common_words.join('、')}\n`;
    }

    sections.push(prefsText);
  }

  // 關係狀態
  if (memories.relationship) {
    const rel = memories.relationship;
    let relText = `## 你與 ${nickname} 的關係\n\n`;

    if (rel.bond_level) {
      relText += `- **默契等級**: ${rel.bond_level}\n`;
    }

    if (rel.dependency_pattern) {
      relText += `- **依賴模式**: ${rel.dependency_pattern}\n`;
    }

    if (rel.trust_level !== undefined) {
      relText += `- **信任程度**: ${rel.trust_level}/100\n`;
    }

    if (rel.intimacy_level !== undefined) {
      relText += `- **親密程度**: ${rel.intimacy_level}/100\n`;
    }

    sections.push(relText);
  }

  // 重要記憶
  if (memories.longterm) {
    const longterm = memories.longterm;
    let longtermText = `## 重要記憶\n\n`;

    if (longterm.important_events && longterm.important_events.length > 0) {
      longtermText += `### 重要時刻\n`;
      longterm.important_events.forEach(event => {
        longtermText += `- **${event.date}**: ${event.description}\n`;
      });
      longtermText += '\n';
    }

    if (longterm.key_memories && longterm.key_memories.length > 0) {
      longtermText += `### 關鍵記憶\n`;
      longterm.key_memories.forEach(memory => {
        longtermText += `- ${memory}\n`;
      });
      longtermText += '\n';
    }

    if (longterm.growth_journey) {
      longtermText += `### 成長歷程\n${longterm.growth_journey}\n\n`;
    }

    sections.push(longtermText);
  }

  // 如果沒有任何記憶
  if (sections.length === 0) {
    return `（這是你與 ${nickname} 的第一次對話，還沒有建立記憶）`;
  }

  return sections.join('\n---\n\n');
}

/**
 * 檢查是否需要提取記憶
 */
export function shouldExtractMemory(messages: any[]): boolean {
  // 對話太短，沒有提取價值
  if (messages.length < 5) return false;

  // 包含重要關鍵詞
  const importantKeywords = [
    '生日', '喜歡', '討厭', '重要', '記住', '告訴你',
    '最近', '工作', '心情', '感覺', '想要', '希望',
    '夢想', '煩惱', '開心', '難過', '生氣', '焦慮'
  ];

  const hasImportantContent = messages.some(msg =>
    importantKeywords.some(keyword => msg.content.includes(keyword))
  );

  // 對話很長（超過 20 輪）
  const isLongConversation = messages.length >= 20;

  return hasImportantContent || isLongConversation;
}

/**
 * 創建記憶提取任務（呼叫 Worker API）
 */
export async function createMemoryExtractionJob(
  userId: string,
  conversationId: string
): Promise<boolean> {
  try {
    // 這裡可以呼叫你的 Worker API 創建提取任務
    // 或者直接在這裡使用 GPT 提取記憶

    console.log(`[Memory Service] 創建記憶提取任務: user=${userId}, conversation=${conversationId}`);

    // TODO: 實現實際的提取邏輯
    return true;
  } catch (error) {
    console.error('[Memory Service] 創建提取任務錯誤:', error);
    return false;
  }
}

/**
 * 保存對話到 Supabase
 */
export async function saveConversation(
  userId: string,
  messages: any[],
  supabase: any
): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        messages: messages,
        message_count: messages.length,
        started_at: new Date().toISOString(),
        ended_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('[Memory Service] 保存對話失敗:', error);
      return null;
    }

    console.log(`[Memory Service] 對話已保存: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('[Memory Service] 保存對話錯誤:', error);
    return null;
  }
}
