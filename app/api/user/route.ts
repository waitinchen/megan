export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/user
 * 獲取當前用戶資訊
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[API User] Profile fetch error:', profileError);
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        provider: user.app_metadata.provider,
        identities: user.identities?.map(id => id.provider) || [],
        profile: profile || null,
      },
    });
  } catch (error: any) {
    console.error('[API User] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/user
 * 更新用戶資訊（暱稱等）
 */
export async function PATCH(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { nickname } = body;

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid nickname' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        nickname: nickname.trim(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error: any) {
    console.error('[API User] PATCH Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
