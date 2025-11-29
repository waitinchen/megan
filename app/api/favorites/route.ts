export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/favorites
 * 獲取用戶的所有收藏
 * 支援查詢參數：search (搜尋關鍵字), sort (asc/desc)
 */
export async function GET(request: Request) {
  try {
    
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'desc'; // 'asc' or 'desc'
    const checkContent = searchParams.get('check_content'); // 用於檢查特定內容是否已收藏

    // 如果只是檢查特定內容是否已收藏
    if (checkContent) {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('content', checkContent)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      return NextResponse.json({ 
        isFavorited: !!data,
        favoriteId: data?.id || null
      });
    }

    let query = supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id);

    // 搜尋功能
    if (search && search.trim()) {
      query = query.ilike('content', `%${search.trim()}%`);
    }

    // 排序
    query = query.order('created_at', { ascending: sort === 'asc' });

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ favorites: data || [] });
  } catch (error: any) {
    console.error('[API Favorites] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/favorites
 * 新增收藏（防重複檢查）
 */
export async function POST(request: Request) {
  try {
    
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, content, audio_url } = body;

    if (!type || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: type, content' },
        { status: 400 }
      );
    }

    if (type !== 'text' && type !== 'audio') {
      return NextResponse.json(
        { error: 'Invalid type. Must be "text" or "audio"' },
        { status: 400 }
      );
    }

    // 檢查是否已經收藏過相同的內容
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('content', content)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '此內容已收藏', alreadyFavorited: true, favoriteId: existing.id },
        { status: 409 } // 409 Conflict
      );
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: user.id,
        type,
        content,
        audio_url: audio_url || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ favorite: data });
  } catch (error: any) {
    console.error('[API Favorites] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/favorites
 * 刪除收藏
 */
export async function DELETE(request: Request) {
  try {
    
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing required parameter: id' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id); // Ensure user owns the favorite

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Favorites] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
