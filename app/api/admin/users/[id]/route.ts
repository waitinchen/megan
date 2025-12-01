export const dynamic = 'force-dynamic';

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { ok, unauthorized, notFound, serverError } from '@/app/lib/api/response';

const ADMIN_EMAIL = 'waitinchen@gmail.com';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();

        // 驗證管理員
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            return unauthorized();
        }

        const { id: userId } = await params;

        // 獲取用戶基本信息
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (!profile) {
            return notFound('User not found');
        }

        // 獲取 email
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const authUser = users?.find(u => u.id === userId);

        // 獲取對話列表
        const { data: conversations } = await supabase
            .from('conversations')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        // 獲取收藏列表
        const { data: favorites } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10);

        // 統計數據
        const { count: totalMessages } = await supabase
            .from('conversation_messages')
            .select('*', { count: 'exact', head: true })
            .in('conversation_id', conversations?.map(c => c.id) || []);

        return ok({
            user: {
                ...profile,
                email: authUser?.email || 'N/A',
            },
            conversations: conversations || [],
            favorites: favorites || [],
            stats: {
                totalMessages: totalMessages || 0,
                totalConversations: conversations?.length || 0,
                totalFavorites: favorites?.length || 0,
            },
        });
    } catch (error: any) {
        console.error('[API Admin User Detail] Error:', error);
        return serverError(error?.message || 'Unknown error');
    }
}
