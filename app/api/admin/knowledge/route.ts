export const dynamic = 'force-dynamic';

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { ok, fail, unauthorized, serverError } from '@/app/lib/api/response';

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

        // 從數據庫獲取所有活躍的知識
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .eq('is_active', true)
            .order('priority', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[API Admin Knowledge] GET Error:', error);
            return serverError(error.message);
        }

        return ok({
            knowledge: data || [],
        });
    } catch (error: any) {
        console.error('[API Admin Knowledge] GET Error:', error);
        return serverError(error.message);
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

        const { title, content, category, tags, priority } = await request.json();

        if (!title || !content || !category) {
            return fail('VALIDATION_ERROR', 'title, content, and category are required', 400);
        }

        // 插入新知識
        const { data, error } = await supabase
            .from('knowledge_base')
            .insert({
                title,
                content,
                category,
                tags: tags || [],
                priority: priority || 0,
                created_by: user.email,
            })
            .select()
            .single();

        if (error) {
            console.error('[API Admin Knowledge] POST Error:', error);
            return serverError(error.message);
        }

        console.log(`[API Admin Knowledge] 新知識已添加: ${title}`);

        return ok({
            success: true,
            message: '知識已添加',
            data,
        });
    } catch (error: any) {
        console.error('[API Admin Knowledge] POST Error:', error);
        return serverError(error.message);
    }
}

/**
 * DELETE /api/admin/knowledge
 * 刪除知識 (軟刪除,設為 inactive)
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

        if (!id) {
            return fail('VALIDATION_ERROR', 'id is required', 400);
        }

        // 軟刪除 (設為 inactive)
        const { error } = await supabase
            .from('knowledge_base')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error('[API Admin Knowledge] DELETE Error:', error);
            return serverError(error.message);
        }

        console.log(`[API Admin Knowledge] 知識已刪除: ${id}`);

        return ok({
            success: true,
            message: '知識已刪除',
        });
    } catch (error: any) {
        console.error('[API Admin Knowledge] DELETE Error:', error);
        return serverError(error.message);
    }
}
