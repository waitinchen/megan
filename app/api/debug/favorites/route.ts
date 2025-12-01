/**
 * 診斷 API - 檢查 session 和收藏數據
 */

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const supabase = await createSupabaseRouteHandlerClient();

        // 1. 檢查 session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
            return NextResponse.json({
                error: 'Session error',
                details: sessionError.message
            }, { status: 500 });
        }

        if (!session) {
            return NextResponse.json({
                error: 'No session found',
                hasSession: false
            }, { status: 401 });
        }

        const userId = session.user.id;

        // 2. 直接查詢收藏 (不使用 RLS)
        const { data: allFavorites, error: allError } = await supabase
            .from('favorites')
            .select('*', { count: 'exact' });

        // 3. 使用 RLS 查詢收藏
        const { data: userFavorites, error: userError } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', userId);

        // 4. 返回診斷信息
        return NextResponse.json({
            session: {
                userId: userId,
                email: session.user.email,
                hasSession: true
            },
            favorites: {
                totalInDatabase: allFavorites?.length || 0,
                userFavorites: userFavorites?.length || 0,
                userFavoritesData: userFavorites || [],
                allFavoritesUserIds: allFavorites?.map(f => f.user_id) || []
            },
            errors: {
                allError: allError?.message || null,
                userError: userError?.message || null
            }
        });

    } catch (error: any) {
        return NextResponse.json({
            error: 'Unexpected error',
            details: error.message
        }, { status: 500 });
    }
}
