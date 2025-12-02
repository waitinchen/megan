export const dynamic = 'force-dynamic';

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { ok, fail, unauthorized, serverError } from '@/app/lib/api/response';
import { getUserMemories, updateUserMemory } from '@/app/lib/memory/memory-service';
import { updateUserAffinityScore } from '@/app/lib/memory/score-calculator';

/**
 * GET /api/memory
 * 獲取用戶的完整記憶
 */
export async function GET(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return unauthorized();
        }

        const userId = session.user.id;

        // 獲取記憶數據
        const memories = await getUserMemories(userId);

        // 獲取默契指數
        const { data: profile } = await supabase
            .from('profiles')
            .select('relationship_score')
            .eq('id', userId)
            .single();

        return ok({
            memories,
            score: profile?.relationship_score || 0,
        });
    } catch (error: any) {
        console.error('[API Memory] GET Error:', error);
        return serverError(error?.message || 'Unknown error');
    }
}

/**
 * POST /api/memory
 * 更新單一記憶類型
 */
export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return unauthorized();
        }

        const userId = session.user.id;
        const { type, data } = await request.json();

        // 驗證類型
        if (!['profile', 'preferences', 'relationship', 'longterm'].includes(type)) {
            return fail('INVALID_TYPE', 'Invalid memory type. Must be one of: profile, preferences, relationship, longterm', 400);
        }

        // 更新記憶
        const success = await updateUserMemory(userId, type, data);

        if (!success) {
            return fail('UPDATE_FAILED', 'Failed to update memory', 500);
        }

        // 重新計算默契指數
        const newScore = await updateUserAffinityScore(userId, supabase);

        console.log(`[API Memory] 記憶已更新: type=${type}, newScore=${newScore}`);

        return ok({
            success: true,
            type,
            score: newScore,
        });
    } catch (error: any) {
        console.error('[API Memory] POST Error:', error);
        return serverError(error?.message || 'Unknown error');
    }
}

/**
 * PUT /api/memory
 * 批量更新記憶
 */
export async function PUT(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return unauthorized();
        }

        const userId = session.user.id;
        const { memories } = await request.json();

        // 獲取現有記憶
        const existing = await getUserMemories(userId);

        // 合併
        const merged = {
            profile: { ...existing.profile, ...memories.profile },
            preferences: { ...existing.preferences, ...memories.preferences },
            relationship: { ...existing.relationship, ...memories.relationship },
            longterm: { ...existing.longterm, ...memories.longterm },
        };

        // 保存到 KV
        const MEMORY_API_URL = process.env.NEXT_PUBLIC_MEMORY_API_URL || 'https://tone-memory-core-1.waitin-chen.workers.dev';
        const kvKey = `megan:${userId}`;

        const response = await fetch(`${MEMORY_API_URL}/memory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: kvKey, value: merged }),
        });

        if (!response.ok) {
            return fail('UPDATE_FAILED', 'Failed to update memory to KV', 500);
        }

        // 重新計算默契指數
        const newScore = await updateUserAffinityScore(userId, supabase);

        console.log(`[API Memory] 批量更新完成, newScore=${newScore}`);

        return ok({
            success: true,
            memories: merged,
            score: newScore,
        });
    } catch (error: any) {
        console.error('[API Memory] PUT Error:', error);
        return serverError(error?.message || 'Unknown error');
    }
}
