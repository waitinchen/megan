/**
 * 語氣標籤推理模組 (Ported from Lingya-Voice-Agent)
 * 根據上下文和關鍵詞自動推斷合適的語氣標籤
 */

/**
 * 根據文字內容和上下文推斷語氣標籤
 * @param {string} text - 要分析的文字
 * @param {Object} context - 上下文信息（可選）
 * @param {string} context.userIdentity - 用戶身份（'dad'/'other'）
 * @returns {string[]} 推斷的語氣標籤列表（0-3個）
 */
export function inferEmotionTags(text, context = {}) {
  if (!text || typeof text !== 'string') {
    return ['neutral'];
  }

  const lowerText = text.toLowerCase();
  const { userIdentity } = context;

  // 關鍵詞匹配規則（優先級從高到低）- 基於小軟的標籤系統
  const keywordRules = [
    // Intimate/Seductive (Moonlight) - flirty + breathy + slow
    {
      keywords: ['love', 'miss you', 'want you', 'come here', '愛', '想你', '過來', '喜歡', '寂寞', 'lonely', '嗯', '嘿'],
      tags: ['flirty', 'breathy', 'slow'],
      priority: 10,
    },
    // Mysterious/Deep (Shadow) - calm + thoughtful
    {
      keywords: ['truth', 'secret', 'hide', 'dark', 'night', 'moon', '真話', '秘密', '夜晚', '月亮', '藏', '…'],
      tags: ['calm', 'thoughtful'],
      priority: 9,
    },
    // Playful/Dangerous (Feline) - playful + half-joking
    {
      keywords: ['bad', 'dangerous', 'play', 'game', '壞', '危險', '玩', '遊戲', '嘻', '哈哈', '你知道'],
      tags: ['playful', 'half-joking'],
      priority: 8,
    },
    // Sad/Vulnerable (Rain) - tender + breathy
    {
      keywords: ['sad', 'cry', 'hurt', 'pain', '難過', '哭', '痛', '傷心'],
      tags: ['tender', 'breathy'],
      priority: 7,
    },
    // Emotional/Excited - emotional + focused
    {
      keywords: ['haha', 'lol', 'funny', 'joke', '好笑', '有趣', 'excited'],
      tags: ['emotional', 'focused'],
      priority: 6,
    },
  ];

  // 收集所有匹配的規則
  const matchedRules = [];
  for (const rule of keywordRules) {
    const matchCount = rule.keywords.filter(keyword =>
      lowerText.includes(keyword.toLowerCase())
    ).length;

    if (matchCount > 0) {
      matchedRules.push({
        ...rule,
        matchCount,
        score: rule.priority * matchCount,
      });
    }
  }

  // 按分數排序，選擇最高分的規則
  matchedRules.sort((a, b) => b.score - a.score);

  let selectedTags = [];

  // 如果有匹配的規則，使用最高分的
  if (matchedRules.length > 0) {
    const topRule = matchedRules[0];
    selectedTags = [...topRule.tags];

    // 如果是對老爸，加強撒嬌語氣
    if (userIdentity === 'dad' || userIdentity === '老爸') {
      if (!selectedTags.includes('playful') && !selectedTags.includes('flirty')) {
        // 如果沒有撒嬌相關標籤，添加 warm
        if (!selectedTags.includes('warm')) {
          selectedTags.push('warm');
        }
      }
    }
  } else {
    // No specific keyword match, default to the "Megan" vibe
    // Calm, thoughtful, with breathy undertones
    selectedTags = ['calm', 'breathy', 'slow'];
  }

  // 限制標籤數量（最多3個）
  if (selectedTags.length > 3) {
    selectedTags = selectedTags.slice(0, 3);
  }

  // 去重
  return [...new Set(selectedTags)];
}
