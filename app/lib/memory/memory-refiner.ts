/**
 * Memory Refiner
 * 記憶精煉模塊 - 提升記憶質量和準確度
 */

import type { UserMemory } from './memory-service';

/**
 * 記憶信心度評分
 */
export interface MemoryConfidence {
    value: any;
    confidence: number; // 0-100
    source: 'explicit' | 'inferred' | 'assumed';
    timestamp: number;
}

/**
 * 評估記憶信心度
 */
export function scoreConfidence(memory: Partial<UserMemory>): Partial<UserMemory> {
    // 這個函數會在 LLM prompt 中實現
    // LLM 會為每條記憶評分
    return memory;
}

/**
 * 去重和合併記憶
 */
export function mergeWithDeduplication(
    existing: UserMemory,
    newMemory: Partial<UserMemory>
): UserMemory {
    const merged: UserMemory = JSON.parse(JSON.stringify(existing));

    // Profile 合併
    if (newMemory.profile) {
        merged.profile = {
            ...merged.profile,
            ...newMemory.profile,
        };

        // 去重: 如果新舊值相同,保留舊的 (避免重複更新)
        if (merged.profile.estimated_age === existing.profile?.estimated_age) {
            // 保持不變
        }
    }

    // Preferences 合併
    if (newMemory.preferences) {
        merged.preferences = {
            ...merged.preferences,
            ...newMemory.preferences,
        };

        // 數組去重
        if (newMemory.preferences.avoid_topics) {
            const combined = [
                ...(merged.preferences.avoid_topics || []),
                ...newMemory.preferences.avoid_topics,
            ];
            merged.preferences.avoid_topics = Array.from(new Set(combined));
        }

        if (newMemory.preferences.common_words) {
            const combined = [
                ...(merged.preferences.common_words || []),
                ...newMemory.preferences.common_words,
            ];
            merged.preferences.common_words = Array.from(new Set(combined));
        }
    }

    // Relationship 合併 (取最大值)
    if (newMemory.relationship) {
        merged.relationship = {
            ...merged.relationship,
            ...newMemory.relationship,
        };

        // 信任度和親密度取最大值
        if (typeof newMemory.relationship.trust_level === 'number') {
            merged.relationship.trust_level = Math.max(
                merged.relationship.trust_level || 0,
                newMemory.relationship.trust_level
            );
        }

        if (typeof newMemory.relationship.intimacy_level === 'number') {
            merged.relationship.intimacy_level = Math.max(
                merged.relationship.intimacy_level || 0,
                newMemory.relationship.intimacy_level
            );
        }
    }

    // Longterm 合併
    if (newMemory.longterm) {
        merged.longterm = {
            ...merged.longterm,
            ...newMemory.longterm,
        };

        // 數組去重
        if (newMemory.longterm.important_events) {
            const combined = [
                ...(merged.longterm.important_events || []),
                ...newMemory.longterm.important_events,
            ];
            merged.longterm.important_events = Array.from(new Set(combined));
        }

        if (newMemory.longterm.key_memories) {
            const combined = [
                ...(merged.longterm.key_memories || []),
                ...newMemory.longterm.key_memories,
            ];
            merged.longterm.key_memories = Array.from(new Set(combined));
        }
    }

    return merged;
}

/**
 * 矛盾檢測和解決
 */
export function resolveContradictions(memory: UserMemory): UserMemory {
    // 目前由 LLM 處理矛盾
    // 未來可以添加更複雜的邏輯
    return memory;
}

/**
 * 重要性排序
 */
export function rankByImportance(memory: UserMemory): UserMemory {
    // 核心資訊優先級: 姓名 > 年齡 > 職業 > 偏好 > 其他
    // 目前保持原樣,未來可以添加排序邏輯
    return memory;
}

/**
 * 完整的記憶精煉流程
 */
export function refineMemories(
    existing: UserMemory,
    newExtracted: Partial<UserMemory>
): UserMemory {
    // 1. 信心評分 (由 LLM 完成)
    const scored = scoreConfidence(newExtracted);

    // 2. 去重合併
    const merged = mergeWithDeduplication(existing, scored);

    // 3. 矛盾檢測
    const resolved = resolveContradictions(merged);

    // 4. 重要性排序
    const ranked = rankByImportance(resolved);

    return ranked;
}

/**
 * 構建精煉後的 LLM Prompt
 */
export function buildRefinementPrompt(): string {
    return `
## 記憶精煉原則

請遵循以下原則提取和精煉記憶:

### 1. 準確性 (Accuracy)
- ✅ 只提取**明確提到**的資訊
- ❌ 不要猜測或假設
- ✅ 區分事實和推測

### 2. 信心度評分 (Confidence Scoring)
為每條記憶評估信心度 (0-100):
- **90-100**: 明確陳述 (例: "我今年 32 歲")
- **60-89**: 合理推斷 (例: "我剛畢業" → 約 22-25 歲)
- **0-59**: 不確定假設 (不應記錄)

### 3. 去重原則 (Deduplication)
- 相同類型的資訊,保留最新且信心度最高的
- 合併相似資訊,避免重複

### 4. 矛盾處理 (Contradiction Resolution)
- 發現矛盾時,保留信心度更高的
- 如果信心度相同,保留最新的
- 標記不確定的資訊

### 5. 重要性排序 (Importance Ranking)
優先記錄:
1. 核心資訊: 姓名、年齡、職業
2. 偏好設定: 語氣、話題、興趣
3. 關係狀態: 信任度、親密度
4. 長期記憶: 重要事件、關鍵回憶

### 6. 語義理解 (Semantic Understanding)
識別同義詞和相關概念:
- "工程師" = "程式設計師" = "開發者"
- "喜歡" = "偏好" = "傾向於"

## 輸出格式

請以 JSON 格式輸出,並為關鍵資訊添加信心度:

\`\`\`json
{
  "profile": {
    "estimated_age": 32,
    "estimated_occupation": "產品經理",
    "emotion_patterns": "工作壓力大"
  },
  "preferences": {
    "preferred_tone": "溫柔",
    "interests": ["爵士樂", "冥想"]
  },
  "relationship": {
    "trust_level": 85,
    "intimacy_level": 75,
    "bond_level": "C"
  },
  "longterm": {
    "key_memories": ["學習冥想減壓"]
  }
}
\`\`\`

**重要**: 只記錄信心度 >= 60 的資訊!
`;
}
