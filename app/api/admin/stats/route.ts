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

        // 獲取統計數據
        const stats = await getAdminStats(supabase);

        return ok({ stats });
    } catch (error: any) {
        console.error('[API Admin Stats] Error:', error);
        return serverError(error?.message || 'Unknown error');
    }
}

async function getAdminStats(supabase: any) {
    // 1. 總用戶數
    const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

    // 2. 活躍用戶 (最近 7 天有對話)
    const { count: activeUsers } = await supabase
        .from('conversations')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // 3. 總對話數
    const { count: totalConversations } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true });

    // 4. 總訊息數
    const { count: totalMessages } = await supabase
        .from('conversation_messages')
        .select('*', { count: 'exact', head: true });

    // 5. 平均對話長度
    const { data: avgData } = await supabase
        .from('conversations')
        .select('message_count');

    const avgMessageCount = avgData && avgData.length > 0
        ? avgData.reduce((sum: number, c: any) => sum + (c.message_count || 0), 0) / avgData.length
        : 0;

    // 6. 今日新增用戶
    const { count: newUsersToday } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    // 7. 今日對話數
    const { count: conversationsToday } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    return {
        totalUsers: totalUsers || 0,
        activeUsers: activeUsers || 0,
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0,
        avgMessageCount: Math.round(avgMessageCount * 10) / 10,
        newUsersToday: newUsersToday || 0,
        conversationsToday: conversationsToday || 0,
    };
}
