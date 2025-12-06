export const dynamic = 'force-dynamic';

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { ok, fail, unauthorized } from '@/app/lib/api/response';

const ADMIN_EMAIL = 'waitinchen@gmail.com';

/**
 * GET /api/admin/knowledge
 * 獲取知識庫列表
 */
export async function GET() {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== ADMIN_EMAIL) {
            return unauthorized();
        }

        // TODO: 從數據庫或文件系統載入知識庫
        // 目前返回空列表
        return ok({
            knowledge: [],
        });
    } catch (error: any) {
        console.error('[API Admin Knowledge] GET Error:', error);
        return fail('SERVER_ERROR', error.message);
    }
}

/**
 * POST /api/admin/knowledge
 * 添加新知識
 */
export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== ADMIN_EMAIL) {
            return unauthorized();
        }

        const { title, content, category } = await request.json();

        // TODO: 實際保存到數據庫或文件系統
        console.log('[API Admin Knowledge] 添加知識:', { title, category });

        return ok({
            success: true,
            message: '知識已添加',
        });
    } catch (error: any) {
        console.error('[API Admin Knowledge] POST Error:', error);
        return fail('SERVER_ERROR', error.message);
    }
}

/**
 * DELETE /api/admin/knowledge
 * 刪除知識
 */
export async function DELETE(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.email !== ADMIN_EMAIL) {
            return unauthorized();
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        // TODO: 實際從數據庫或文件系統刪除
        console.log('[API Admin Knowledge] 刪除知識:', id);

        return ok({
            success: true,
            message: '知識已刪除',
        });
    } catch (error: any) {
        console.error('[API Admin Knowledge] DELETE Error:', error);
        return fail('SERVER_ERROR', error.message);
    }
}
