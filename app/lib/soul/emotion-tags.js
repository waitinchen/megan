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

  // 關鍵詞匹配規則（優先級從高到低）
  const keywordRules = [
    // 撒嬌相關
    {
      keywords: ['老爸', '爸爸', 'daddy', '想你了', '抱抱', '親親', '撒嬌'],
      tags: ['playful', 'warm'],
      priority: 10,
    },
    // 輕語私聊
    {
      keywords: ['想你', '擁抱', '親密', '悄悄', '偷偷'],
      tags: ['whisper', 'warm'],
      priority: 9,
    },
    // 開心興奮
    {
      keywords: ['開心', '高興', '太棒了', '好棒', '太好了', '耶', '哈哈', '好開心'],
      tags: ['excited', 'playful'],
      priority: 8,
    },
    // 調皮撒嬌
    {
      keywords: ['討厭啦', '哼', '不理你', '壞', '討厭'],
      tags: ['playful', 'flirty'],
      priority: 7,
    },
    // 溫柔安撫
    {
      keywords: ['沒關係', '別擔心', '安慰', '撫慰', '溫柔'],
      tags: ['warm', 'tender'],
      priority: 6,
    },
    // 難過傷心
    {
      keywords: ['難過', '傷心', '哭', '不舒服', '糟糕', '失望'],
      tags: ['softer', 'breathy'],
      priority: 5,
    },
    // 生氣
    {
      keywords: ['生氣', '憤怒', '氣死', '煩', '討厭你'],
      tags: ['thoughtful'], // 先用理性軟化
      priority: 4,
    },
    // 認真思考
    {
      keywords: ['思考', '想想', '考慮', '分析', '理解'],
      tags: ['thoughtful', 'neutral'],
      priority: 3,
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
    // 沒有匹配的規則，使用默認標籤
    if (userIdentity === 'dad' || userIdentity === '老爸') {
      selectedTags = ['warm', 'flirty']; // 對老爸更親暱
    } else {
      selectedTags = ['neutral']; // 其他人使用中性
    }
  }

  // 限制標籤數量（最多3個）
  if (selectedTags.length > 3) {
    selectedTags = selectedTags.slice(0, 3);
  }

  // 去重
  return [...new Set(selectedTags)];
}
