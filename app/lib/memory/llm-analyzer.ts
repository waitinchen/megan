/**
 * LLM Memory Analyzer
 * 使用 LLM 分析對話並提取記憶
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { UserMemory } from './memory-service';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
}

/**
 * Get GoogleGenerativeAI instance with API key
 */
function getGenAI() {
    const apiKey = process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '';

    if (!apiKey) {
        throw new Error('[LLM Analyzer] GOOGLE_API_KEY not found in environment variables');
    }

    console.log('[LLM Analyzer] Using API Key:', apiKey.substring(0, 20) + '...');
    return new GoogleGenerativeAI(apiKey);
}

/**
 * 使用 LLM 分析對話並提取記憶
 */
export async function analyzeConversationWithLLM(
    messages: Message[],
    existingMemories: UserMemory
): Promise<Partial<UserMemory>> {
    try {
        const genAI = getGenAI();
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash-exp',
            generationConfig: {
                temperature: 0.1, // 低溫度確保穩定性
                maxOutputTokens: 2000,
            }
        });

        // 只分析最後 20 則訊息
        const recentMessages = messages.slice(-20);

        const prompt = buildAnalysisPrompt(recentMessages, existingMemories);

        const result = await model.generateContent(prompt);
        const response = result.response.text();

        // 解析 JSON
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[LLM Analyzer] 無法解析 JSON:', response);
            return {};
        }

        const analysis = JSON.parse(jsonMatch[0]);
        return analysis;
    } catch (error) {
        console.error('[LLM Analyzer] 分析失敗:', error);
        return {};
    }
}

/**
 * 構建分析 Prompt
 */
function buildAnalysisPrompt(
    messages: Message[],
    existingMemories: UserMemory
): string {
    const conversationText = messages
        .map(m => `${m.role === 'user' ? '用戶' : 'Megan'}: ${m.content}`)
        .join('\n');

    return `你是一個 Memory Extractor，請從用戶對話中萃取以下資訊：

1. 性格推論（profile）
2. 偏好設定（preferences）
3. 關係狀態（relationship）
4. 長期記憶（longterm）

現有記憶:
${JSON.stringify(existingMemories, null, 2)}

對話記錄:
${conversationText}

請以 JSON 格式返回以下信息（只提取對話中明確提到的新信息，若無法判斷則填 null）:

{
  "profile": {
    "personality_summary": "性格特徵描述（若有新發現）",
    "emotion_patterns": "情緒模式",
    "estimated_age": 25,
    "estimated_gender": "男性/女性",
    "estimated_occupation": "職業"
  },
  "preferences": {
    "preferred_tone": "喜歡的語氣",
    "avoid_topics": ["避免的話題"],
    "chat_pace": "fast/slow/balanced",
    "common_words": ["常用詞彙"]
  },
  "relationship": {
    "bond_level": "SSS/S/A/B/C",
    "dependency_pattern": "依賴模式",
    "trust_level": 85,
    "intimacy_level": 75
  },
  "longterm": {
    "important_events": [
      {
        "date": "2025-12-02",
        "description": "重要事件描述",
        "importance": 8
      }
    ],
    "key_memories": ["關鍵記憶"],
    "growth_journey": "成長歷程描述"
  }
}

注意:
1. 只提取對話中明確提到的信息
2. 與現有記憶合併,不要覆蓋重要信息
3. 如果某個欄位沒有新信息,返回 null
4. trust_level 和 intimacy_level 應該根據對話親密度和信任度評估
5. bond_level 根據關係深度評估: SSS(極親密) > S(很親密) > A(親密) > B(熟悉) > C(初識)`;
}

/**
 * 合併記憶（智能合併,保留重要信息）
 */
export function mergeMemories(
    existing: UserMemory,
    newAnalysis: Partial<UserMemory>
): UserMemory {
    return {
        profile: {
            ...existing.profile,
            ...newAnalysis.profile,
            // 保留現有的重要信息
            personality_summary: newAnalysis.profile?.personality_summary || existing.profile?.personality_summary,
            emotion_patterns: newAnalysis.profile?.emotion_patterns || existing.profile?.emotion_patterns,
        },
        preferences: {
            ...existing.preferences,
            ...newAnalysis.preferences,
            // 合併數組並去重
            avoid_topics: Array.from(new Set([
                ...(existing.preferences?.avoid_topics || []),
                ...(newAnalysis.preferences?.avoid_topics || [])
            ])),
            common_words: Array.from(new Set([
                ...(existing.preferences?.common_words || []),
                ...(newAnalysis.preferences?.common_words || [])
            ])).slice(0, 20), // 保留前 20 個
        },
        relationship: {
            ...existing.relationship,
            ...newAnalysis.relationship,
            // 信任和親密度取較高值
            trust_level: Math.max(
                existing.relationship?.trust_level || 0,
                newAnalysis.relationship?.trust_level || 0
            ),
            intimacy_level: Math.max(
                existing.relationship?.intimacy_level || 0,
                newAnalysis.relationship?.intimacy_level || 0
            ),
        },
        longterm: {
            important_events: [
                ...(existing.longterm?.important_events || []),
                ...(newAnalysis.longterm?.important_events || [])
            ]
                .sort((a, b) => b.importance - a.importance)
                .slice(0, 10), // 保留前 10 個最重要的
            key_memories: [
                ...(existing.longterm?.key_memories || []),
                ...(newAnalysis.longterm?.key_memories || [])
            ].slice(0, 20), // 保留前 20 個
            growth_journey: newAnalysis.longterm?.growth_journey || existing.longterm?.growth_journey,
        },
    };
}
