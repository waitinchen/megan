/**
 * Memory Service v5 (Simplified)
 * 
 * Client-side service for interacting with the Memory API
 * 
 * Key Structure:
 * memory:v5:users:${userId}:profile
 * memory:v5:users:${userId}:tone
 * memory:v5:users:${userId}:preferences
 * memory:v5:users:${userId}:relationship
 * memory:v5:users:${userId}:longterm
 */

const MEMORY_API_URL = process.env.NEXT_PUBLIC_MEMORY_URL || 'https://tone-memory-core-1.waitin-chen.workers.dev';

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
    chat_pace?: string;
    common_words?: string[];
  };
  relationship?: {
    bond_level?: string;
    dependency_pattern?: string;
    trust_level?: number;
    intimacy_level?: number;
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
 * Save memory with key and value
 */
export async function saveMemory(key: string, value: any): Promise<{ ok: boolean; stored?: any; error?: string }> {
  try {
    const response = await fetch(`${MEMORY_API_URL}/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: typeof value === 'string' ? value : JSON.stringify(value) }),
    });

    return await response.json();
  } catch (error: any) {
    console.error('[Memory Service v5] Error saving memory:', error);
    return { ok: false, error: error.message };
  }
}

/**
 * Load memory by key
 */
export async function loadMemory(key: string): Promise<{ key: string; value: string | null }> {
  try {
    const response = await fetch(`${MEMORY_API_URL}/memory?key=${encodeURIComponent(key)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    return await response.json();
  } catch (error: any) {
    console.error('[Memory Service v5] Error loading memory:', error);
    return { key, value: null };
  }
}

/**
 * Build memory key using v5 structure
 */
function buildMemoryKey(userId: string, category: 'profile' | 'tone' | 'preferences' | 'relationship' | 'longterm' | string): string {
  return `memory:v5:users:${userId}:${category}`;
}

/**
 * Get user memory by category
 */
export async function getUserMemoryByCategory(
  userId: string,
  category: 'profile' | 'tone' | 'preferences' | 'relationship' | 'longterm'
): Promise<any> {
  const key = buildMemoryKey(userId, category);
  const result = await loadMemory(key);
  
  if (!result.value) {
    return null;
  }

  try {
    return JSON.parse(result.value);
  } catch {
    return result.value; // If not JSON, return as string
  }
}

/**
 * Save user memory by category
 */
export async function saveUserMemoryByCategory(
  userId: string,
  category: 'profile' | 'tone' | 'preferences' | 'relationship' | 'longterm',
  value: any
): Promise<boolean> {
  const key = buildMemoryKey(userId, category);
  const result = await saveMemory(key, value);
  return result.ok === true;
}

/**
 * Get all user memories (fetches all categories)
 */
export async function getUserMemories(userId: string): Promise<UserMemory> {
  const [profile, preferences, relationship, longterm] = await Promise.all([
    getUserMemoryByCategory(userId, 'profile'),
    getUserMemoryByCategory(userId, 'preferences'),
    getUserMemoryByCategory(userId, 'relationship'),
    getUserMemoryByCategory(userId, 'longterm'),
  ]);

  const result: UserMemory = {};
  if (profile) result.profile = profile;
  if (preferences) result.preferences = preferences;
  if (relationship) result.relationship = relationship;
  if (longterm) result.longterm = longterm;

  return result;
}

/**
 * Update user memory category (merges with existing data)
 */
export async function updateUserMemory(
  userId: string,
  category: 'profile' | 'preferences' | 'relationship' | 'longterm',
  value: any
): Promise<boolean> {
  const existing = await getUserMemoryByCategory(userId, category);
  const merged = existing ? { ...existing, ...value } : value;
  return await saveUserMemoryByCategory(userId, category, merged);
}

/**
 * Build memory context for LLM
 */
export function buildMemoryContext(nickname: string, memories: UserMemory): string {
  const sections: string[] = [];

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

  if (sections.length === 0) {
    return `（這是你與 ${nickname} 的第一次對話，還沒有建立記憶）`;
  }

  return sections.join('\n---\n\n');
}

/**
 * Check if memory extraction should be triggered
 */
export function shouldExtractMemory(messages: any[]): boolean {
  if (messages.length < 5) return false;

  const importantKeywords = [
    '生日', '喜歡', '討厭', '重要', '記住', '告訴你',
    '最近', '工作', '心情', '感覺', '想要', '希望',
    '夢想', '煩惱', '開心', '難過', '生氣', '焦慮'
  ];

  const hasImportantContent = messages.some(msg =>
    importantKeywords.some(keyword => msg.content.includes(keyword))
  );

  const isLongConversation = messages.length >= 20;

  return hasImportantContent || isLongConversation;
}