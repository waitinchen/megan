export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
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
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ favorites: data || [] });
  } catch (error: any) {
    console.error('[API Favorites] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const userId = session.user.id;
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

    // 防重複檢查
    const { data: existing } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('content', content)
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: '此內容已收藏', alreadyFavorited: true, favoriteId: existing.id },
        { status: 409 }
      );
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ favorite: data });
  } catch (error: any) {
    console.error('[API Favorites] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const userId = session.user.id;
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
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Favorites] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}