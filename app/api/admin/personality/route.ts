export const dynamic = 'force-dynamic';

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { ok, fail, unauthorized, serverError } from '@/app/lib/api/response';

const ADMIN_EMAIL = 'waitinchen@gmail.com';

/**
 * GET /api/admin/personality
 * 獲取當前啟用的人格設定
 */
export async function GET() {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== ADMIN_EMAIL) {
            return unauthorized();
        }

        // 從數據庫獲取當前啟用的人格設定
        const { data, error } = await supabase
            .from('personality_configs')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
            console.error('[API Admin Personality] GET Error:', error);
            return serverError(error.message);
        }

        return ok({
            systemPrompt: data?.system_prompt || '',
            firstMessage: data?.first_message || '',
            version: data?.version || 1,
            description: data?.description || '',
        });
    } catch (error: any) {
        console.error('[API Admin Personality] GET Error:', error);
        return serverError(error.message);
    }
}

/**
 * POST /api/admin/personality
 * 創建新的人格設定版本
 */
export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== ADMIN_EMAIL) {
            return unauthorized();
        }

        const { systemPrompt, firstMessage, description } = await request.json();

        if (!systemPrompt || !firstMessage) {
            return fail('VALIDATION_ERROR', 'systemPrompt and firstMessage are required', 400);
        }

        // 獲取當前最大版本號
        const { data: maxVersion } = await supabase
            .from('personality_configs')
            .select('version')
            .order('version', { ascending: false })
            .limit(1)
            .single();

        const newVersion = (maxVersion?.version || 0) + 1;

        // 插入新版本 (觸發器會自動將其他版本設為 inactive)
        const { data, error } = await supabase
            .from('personality_configs')
            .insert({
                system_prompt: systemPrompt,
                first_message: firstMessage,
                version: newVersion,
                is_active: true,
                description: description || `版本 ${newVersion}`,
                created_by: user.email,
            })
            .select()
            .single();

        if (error) {
            console.error('[API Admin Personality] POST Error:', error);
            return serverError(error.message);
        }

        console.log(`[API Admin Personality] 新版本已創建: v${newVersion}`);

        return ok({
            success: true,
            message: `人格設定 v${newVersion} 已保存並啟用`,
            version: newVersion,
            data,
        });
    } catch (error: any) {
        console.error('[API Admin Personality] POST Error:', error);
        return serverError(error.message);
    }
}
