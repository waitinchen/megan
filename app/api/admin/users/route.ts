export const dynamic = 'force-dynamic';

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { ok, unauthorized, serverError } from '@/app/lib/api/response';

const ADMIN_EMAIL = 'waitinchen@gmail.com';

export async function GET(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();

        // 驗證管理員
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || user.email !== ADMIN_EMAIL) {
            return unauthorized();
        }

        // 解析查詢參數
        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        // 構建查詢
        let query = supabase
            .from('profiles')
            .select(`
        id,
        nickname,
        avatar_url,
        total_conversations,
        relationship_score,
        last_conversation_at,
        created_at
      `, { count: 'exact' });

        // 搜尋過濾
        if (search) {
            // 需要 join auth.users 來搜尋 email
            // 由於 RLS 限制,我們使用服務端查詢
            const { data: allProfiles } = await supabase
                .from('profiles')
                .select('*');

            const { data: users } = await supabase.auth.admin.listUsers();

            const filteredUsers = users?.users.filter(u =>
                u.email?.toLowerCase().includes(search.toLowerCase()) ||
                allProfiles?.find(p => p.id === u.id && p.nickname?.toLowerCase().includes(search.toLowerCase()))
            ) || [];

            const userIds = filteredUsers.map(u => u.id);
            query = query.in('id', userIds.length > 0 ? userIds : ['00000000-0000-0000-0000-000000000000']);
        }

        // 排序和分頁
        const { data: profiles, error, count } = await query
            .order('last_conversation_at', { ascending: false, nullsFirst: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        // 獲取用戶 email (需要從 auth.users)
        const { data: { users } } = await supabase.auth.admin.listUsers();

        const usersWithEmail = profiles?.map(profile => {
            const authUser = users?.find(u => u.id === profile.id);
            return {
                ...profile,
                email: authUser?.email || 'N/A',
            };
        }) || [];

        return ok({
            users: usersWithEmail,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error: any) {
        console.error('[API Admin Users] Error:', error);
        return serverError(error?.message || 'Unknown error');
    }
}
