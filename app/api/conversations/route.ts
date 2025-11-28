import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

/**
 * GET /api/conversations
 * 獲取用戶的所有對話列表
 */
export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 如果提供了對話 ID，獲取特定對話的詳細信息（包含所有訊息）
    if (conversationId) {
      // 獲取對話基本資訊
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convError || !conversation) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // 獲取對話的所有訊息
      const { data: messages, error: messagesError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      return NextResponse.json({
        conversation: {
          ...conversation,
          messages: messages || []
        }
      });
    }

    // 否則獲取對話列表
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return NextResponse.json({ conversations: data || [] });
  } catch (error: any) {
    console.error('[API Conversations] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/conversations
 * 創建新對話或更新現有對話
 */
export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { conversationId, title, messages } = body;

    // 如果有 conversationId，表示更新現有對話
    if (conversationId) {
      // 驗證對話屬於該用戶
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (!existingConv) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
      }

      // 更新對話標題（如果提供）
      if (title !== undefined) {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ title })
          .eq('id', conversationId);

        if (updateError) throw updateError;
      }

      // 如果提供了訊息，添加新訊息
      if (messages && Array.isArray(messages) && messages.length > 0) {
        const messageInserts = messages.map((msg: any) => ({
          conversation_id: conversationId,
          role: msg.role,
          content: msg.content,
          emotion: msg.emotion || null,
          audio_url: msg.audio || null,
        }));

        const { error: insertError } = await supabase
          .from('conversation_messages')
          .insert(messageInserts);

        if (insertError) throw insertError;
      }

      // 返回更新後的對話
      const { data: updatedConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      return NextResponse.json({ conversation: updatedConv });
    }

    // 創建新對話
    const preview = messages && messages.length > 0 
      ? messages[0].content?.substring(0, 100) || ''
      : '';

    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        title: title || null,
        preview,
        message_count: 0,
      })
      .select()
      .single();

    if (createError) throw createError;

    // 如果有訊息，添加訊息
    if (messages && Array.isArray(messages) && messages.length > 0) {
      const messageInserts = messages.map((msg: any) => ({
        conversation_id: newConversation.id,
        role: msg.role,
        content: msg.content,
        emotion: msg.emotion || null,
        audio_url: msg.audio || null,
      }));

      const { error: insertError } = await supabase
        .from('conversation_messages')
        .insert(messageInserts);

      if (insertError) throw insertError;
    }

    // 重新獲取對話（包含更新後的 metadata）
    const { data: finalConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', newConversation.id)
      .single();

    return NextResponse.json({ conversation: finalConversation });
  } catch (error: any) {
    console.error('[API Conversations] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/conversations?id=xxx
 * 刪除對話
 */
export async function DELETE(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json({ error: 'Missing conversation ID' }, { status: 400 });
    }

    // 驗證對話屬於該用戶
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (!existingConv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 刪除對話（會自動刪除相關訊息，因為有 ON DELETE CASCADE）
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Conversations] DELETE Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

