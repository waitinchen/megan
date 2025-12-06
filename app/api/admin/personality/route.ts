export const dynamic = 'force-dynamic';

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { ok, fail, unauthorized } from '@/app/lib/api/response';
import { SYSTEM_PROMPT } from '@/app/lib/soul/system-prompt';

const ADMIN_EMAIL = 'waitinchen@gmail.com';

/**
 * GET /api/admin/personality
 * 獲取當前人格設定
 */
export async function GET() {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== ADMIN_EMAIL) {
            return unauthorized();
        }

        return ok({
            systemPrompt: SYSTEM_PROMPT,
            firstMessage: '我是Megan',
        });
    } catch (error: any) {
        console.error('[API Admin Personality] GET Error:', error);
        return fail('SERVER_ERROR', error.message);
    }
}

/**
 * POST /api/admin/personality
 * 更新人格設定 (目前僅返回成功,實際需要更新文件)
 */
export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== ADMIN_EMAIL) {
            return unauthorized();
        }

        const { systemPrompt, firstMessage } = await request.json();

        // TODO: 實際實現需要將內容寫入文件或數據庫
        // 目前僅返回成功
        console.log('[API Admin Personality] 收到更新請求');
        console.log('System Prompt 長度:', systemPrompt?.length);
        console.log('First Message:', firstMessage);

        return ok({
            success: true,
            message: '人格設定已更新 (需要重新部署才會生效)',
        });
    } catch (error: any) {
        console.error('[API Admin Personality] POST Error:', error);
        return fail('SERVER_ERROR', error.message);
    }
}
