/**
 * 診斷 API - 檢查 session 和收藏數據
 * 公開端點 - 用於調試
 */

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createSupabaseRouteHandlerClient();

        // 1. 檢查 session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        const hasSession = !!session;
        const userId = session?.user?.id || null;
        const userEmail = session?.user?.email || null;

        // 2. 如果有 session,查詢收藏
        let userFavorites = null;
        let userError = null;

        if (hasSession && userId) {
            const result = await supabase
                .from('favorites')
                .select('*')
                .eq('user_id', userId);

            userFavorites = result.data;
            userError = result.error;
        }

        // 3. 返回診斷信息 (不包含敏感數據)
        return NextResponse.json({
            session: {
                hasSession,
                userId: userId ? `${userId.substring(0, 8)}...` : null,
                email: userEmail,
                sessionError: sessionError?.message || null
            },
            favorites: {
                userFavoritesCount: userFavorites?.length || 0,
                userError: userError?.message || null
            },
            timestamp: new Date().toISOString()
        });

    } catch (error: any) {
        return NextResponse.json({
            error: 'Unexpected error',
            details: error.message
        }, { status: 500 });
    }
}
