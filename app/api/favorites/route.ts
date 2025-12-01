export const dynamic = 'force-dynamic';

import { createSupabaseRouteHandlerClient } from '@/app/lib/supabase-server';
import { ok, fail, unauthorized, serverError } from '@/app/lib/api/response';
import { ERROR_CODES } from '@/app/lib/api/errors';

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return unauthorized();
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'desc';
    const checkContent = searchParams.get('check_content');

    // 檢查特定內容是否已收藏
    if (checkContent) {
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', userId)
        .eq('content', checkContent)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        return fail(ERROR_CODES.DATABASE_ERROR, error.message, 500);
      }

      return ok({
        isFavorited: !!data,
        favoriteId: data?.id || null
      });
    }

    // 獲取收藏列表
    console.log('[API Favorites] 獲取收藏列表, userId:', userId);

    let query = supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId);

    if (search && search.trim()) {
      query = query.ilike('content', `%${search.trim()}%`);
    }

    query = query.order('created_at', { ascending: sort === 'asc' });

    const { data, error } = await query;

    console.log('[API Favorites] 查詢結果:', {
      dataCount: data?.length || 0,
      error: error?.message || null,
      userId: userId
    });

    if (error) {
      console.error('[API Favorites] 資料庫錯誤:', error);
      return fail(ERROR_CODES.DATABASE_ERROR, error.message, 500);
    }

    console.log('[API Favorites] 返回收藏數量:', data?.length || 0);
    return ok({ favorites: data || [] });
  } catch (error: any) {
    console.error('[API Favorites] GET Error:', error);
    return serverError(typeof error === 'string' ? error : error?.message || 'Unknown error');
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return unauthorized();
    }

    const userId = session.user.id;
    const body = await request.json();
    const { type, content, audio_url } = body;

    if (!type || !content) {
      return fail(ERROR_CODES.MISSING_FIELD, 'Missing required fields: type, content');
    }

    if (type !== 'text' && type !== 'audio') {
      return fail(ERROR_CODES.INVALID_FORMAT, 'Invalid type. Must be "text" or "audio"');
    }

    // 防重複檢查
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('content', content)
      .limit(1)
      .single();

    if (existing) {
      return fail(ERROR_CODES.ALREADY_EXISTS, '此內容已收藏', 409);
    }

    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        type,
        content,
        audio_url: audio_url || null,
      })
      .select()
      .single();

    if (error) {
      return fail(ERROR_CODES.DATABASE_ERROR, error.message, 500);
    }

    return ok({ favorite: data });
  } catch (error: any) {
    console.error('[API Favorites] POST Error:', error);
    return serverError(typeof error === 'string' ? error : error?.message || 'Unknown error');
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseRouteHandlerClient();

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return unauthorized();
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return fail(ERROR_CODES.MISSING_FIELD, 'Missing required parameter: id');
    }

    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      return fail(ERROR_CODES.DATABASE_ERROR, error.message, 500);
    }

    return ok({ success: true });
  } catch (error: any) {
    console.error('[API Favorites] DELETE Error:', error);
    return serverError(typeof error === 'string' ? error : error?.message || 'Unknown error');
  }
}