export const dynamic = 'force-dynamic';

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { ok, fail, unauthorized, serverError } from '@/app/lib/api/response';
import { getUserMemories } from '@/app/lib/memory/memory-service';
import { analyzeConversationWithLLM, mergeMemories } from '@/app/lib/memory/llm-analyzer';
import { updateUserAffinityScore } from '@/app/lib/memory/score-calculator';

/**
 * POST /api/memory/extract
 * 自動記憶提取 (使用 LLM 分析對話)
 */
export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return unauthorized();
        }

        const userId = user.id;
        const { conversationId, messages } = await request.json();

        // 驗證輸入
        if (!conversationId || !messages || !Array.isArray(messages)) {
            return fail('INVALID_INPUT', 'conversationId and messages are required', 400);
        }

        // 檢查是否值得提取 (至少 5 輪對話)
        if (messages.length < 5) {
            console.log(`[Memory Extract] 對話太短 (${messages.length} 則),跳過提取`);
            return ok({ extracted: false, reason: 'conversation_too_short' });
        }

        console.log(`[Memory Extract] 開始提取記憶: conversationId=${conversationId}, messages=${messages.length}`);

        // 1. 獲取現有記憶
        const existingMemories = await getUserMemories(userId);

        // 2. 使用 LLM 分析對話
        const analysis = await analyzeConversationWithLLM(messages, existingMemories);

        // 3. 合併記憶
        const mergedMemories = mergeMemories(existingMemories, analysis);

        // 4. 保存到 KV
        const MEMORY_API_URL = process.env.NEXT_PUBLIC_MEMORY_API_URL || 'https://tone-memory-core-1.waitin-chen.workers.dev';
        const kvKey = `megan:${userId}`;

        const kvResponse = await fetch(`${MEMORY_API_URL}/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: kvKey, value: mergedMemories }),
        });

        if (!kvResponse.ok) {
            console.error('[Memory Extract] KV 更新失敗:', await kvResponse.text());
            return fail('KV_UPDATE_FAILED', 'Failed to update memory to KV', 500);
        }

        // 5. 重新計算默契指數
        const newScore = await updateUserAffinityScore(userId, supabase);

        console.log(`[Memory Extract] 提取完成: newScore=${newScore}`);

        return ok({
            extracted: true,
            analysis,
            score: newScore,
        });
    } catch (error: any) {
        console.error('[API Memory Extract] Error:', error);
        return serverError(error?.message || 'Unknown error');
    }
}
