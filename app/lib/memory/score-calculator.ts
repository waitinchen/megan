/**
 * Affinity Score Calculator
 * 計算用戶與 Megan 的默契指數 (0-100)
 */

export interface AffinityMetrics {
    conversations: number;      // 對話次數
    messages: number;           // 訊息數量
    trust: number;              // 信任程度 (0-100)
    intimacy: number;           // 親密程度 (0-100)
    activeDays: number;         // 活躍天數
}

/**
 * 計算默契指數
 * 
 * 公式:
 * - 對話次數: 最高 30 分 (30 次對話 = 滿分)
 * - 訊息數量: 最高 20 分 (200 則訊息 = 滿分)
 * - 信任程度: 最高 25 分
 * - 親密程度: 最高 25 分
 * - 時間加成: 最高 10 分 (30 天活躍 = 滿分)
 */
export function calculateAffinityScore(metrics: AffinityMetrics): number {
    const {
        conversations,
        messages,
        trust,
        intimacy,
        activeDays
    } = metrics;

    // 1. 對話次數權重 (最高 30 分)
    const conversationScore = Math.min((conversations / 30) * 30, 30);

    // 2. 訊息數量權重 (最高 20 分)
    const messageScore = Math.min((messages / 200) * 20, 20);

    // 3. 信任程度權重 (最高 25 分)
    const trustScore = (trust / 100) * 25;

    // 4. 親密程度權重 (最高 25 分)
    const intimacyScore = (intimacy / 100) * 25;

    // 5. 時間加成 (最高 10 分)
    const timeBonus = Math.min((activeDays / 30) * 10, 10);

    const total = conversationScore + messageScore + trustScore + intimacyScore + timeBonus;

    return Math.min(Math.round(total), 100);
}

/**
 * 從資料庫和記憶數據計算默契指數
 */
export async function calculateUserAffinityScore(
    userId: string,
    supabase: any
): Promise<number> {
    try {
        // 1. 獲取對話統計
        const { data: profile } = await supabase
            .from('profiles')
            .select('total_conversations, created_at')
            .eq('id', userId)
            .single();

        if (!profile) return 0;

        // 2. 獲取訊息總數
        const { data: conversations } = await supabase
            .from('conversations')
            .select('id, message_count')
            .eq('user_id', userId);

        const totalMessages = conversations?.reduce((sum, c) => sum + (c.message_count || 0), 0) || 0;

        // 3. 計算活躍天數
        const createdAt = new Date(profile.created_at);
        const now = new Date();
        const activeDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

        // 4. 獲取記憶數據 (信任和親密程度)
        const { getUserMemories } = await import('./memory-service');
        const memories = await getUserMemories(userId);

        const trust = memories.relationship?.trust_level || 0;
        const intimacy = memories.relationship?.intimacy_level || 0;

        // 5. 計算分數
        const score = calculateAffinityScore({
            conversations: profile.total_conversations || 0,
            messages: totalMessages,
            trust,
            intimacy,
            activeDays,
        });

        return score;
    } catch (error) {
        console.error('[Score Calculator] 計算失敗:', error);
        return 0;
    }
}

/**
 * 更新用戶的默契指數到資料庫
 */
export async function updateUserAffinityScore(
    userId: string,
    supabase: any
): Promise<number> {
    const score = await calculateUserAffinityScore(userId, supabase);

    await supabase
        .from('profiles')
        .update({ relationship_score: score })
        .eq('id', userId);

    console.log(`[Score Calculator] 用戶 ${userId} 默契指數更新為 ${score}`);

    return score;
}
