import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/favorites
 * 獲取用戶的所有收藏
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ favorites: data });
  } catch (error: any) {
    console.error('[API Favorites] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/favorites
 * 新增收藏
 */
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
