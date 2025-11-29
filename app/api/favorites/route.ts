export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { ok, fail, unauthorized, serverError } from '@/app/lib/api/response';
import { ERROR_CODES } from '@/app/lib/api/errors';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
    let query = supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId);

    if (search && search.trim()) {
      query = query.ilike('content', `%${search.trim()}%`);
    }

    query = query.order('created_at', { ascending: sort === 'asc' });

    const { data, error } = await query;

    if (error) {
      return fail(ERROR_CODES.DATABASE_ERROR, error.message, 500);
    }

    return ok({ favorites: data || [] });
  } catch (error: any) {
    console.error('[API Favorites] GET Error:', error);
    return serverError(error.message);
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
    return serverError(error.message);
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
    return serverError(error.message);
  }
}