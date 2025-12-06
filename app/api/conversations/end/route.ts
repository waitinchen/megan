/**
 * Conversation End API
 * 
 * 標記對話結束,設置 ended_at 時間戳
 */

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const supabase = await createSupabaseRouteHandlerClient();

        // 驗證用戶認證
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { conversationId } = await request.json();

        if (!conversationId) {
            return NextResponse.json(
                { error: 'conversationId is required' },
                { status: 400 }
            );
        }

        // 設置對話結束時間
        const { error } = await supabase
            .from('conversations')
            .update({ ended_at: new Date().toISOString() })
            .eq('id', conversationId)
            .eq('user_id', user.id); // 確保只能結束自己的對話

        if (error) {
            console.error('[API End Conversation] 設置結束時間失敗:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        console.log(`[API End Conversation] 對話已結束: ${conversationId}`);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('[API End Conversation] 錯誤:', error);
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}
