export const dynamic = 'force-dynamic';

import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { ok, fail, unauthorized, notFound, serverError } from '@/app/lib/api/response';
import { ERROR_CODES } from '@/app/lib/api/errors';

export async function GET(request: Request) {
  try {
    // Ensure cookies are accessed correctly in Next.js App Router
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return unauthorized();
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // 如果提供了對話 ID，獲取特定對話的詳細信息（包含所有訊息）
    if (conversationId) {
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (convError || !conversation) {
        return notFound('Conversation not found');
      }

      const { data: messages, error: messagesError } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        return fail(ERROR_CODES.DATABASE_ERROR, messagesError.message, 500);
      }

      return ok({
        conversation: {
          ...conversation,
          messages: messages || []
        }
      });
    }

    // 獲取對話列表
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return fail(ERROR_CODES.DATABASE_ERROR, error.message, 500);
    }

    return ok({ conversations: data || [] });
  } catch (error: any) {
    console.error('[API Conversations] GET Error:', error);
    return serverError(typeof error === 'string' ? error : error?.message || 'Unknown error');
  }
}

export async function POST(request: Request) {
  try {
    // Ensure cookies are accessed correctly in Next.js App Router
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return unauthorized();
    }

    const userId = session.user.id;
    const body = await request.json();
    const { conversationId, title, messages } = body;

    // 如果有 conversationId，表示更新現有對話
    if (conversationId) {
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (!existingConv) {
        return notFound('Conversation not found');
      }

      // 更新對話標題（如果提供）
      if (title !== undefined) {
        const { error: updateError } = await supabase
          .from('conversations')
          .update({ title })
          .eq('id', conversationId);

        if (updateError) {
          return fail(ERROR_CODES.DATABASE_ERROR, updateError.message, 500);
        }
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

        if (insertError) {
          return fail(ERROR_CODES.DATABASE_ERROR, insertError.message, 500);
        }
      }

      // 返回更新後的對話
      const { data: updatedConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      return ok({ conversation: updatedConv });
    }

    // 創建新對話
    const preview = messages && messages.length > 0 
      ? messages[0].content?.substring(0, 100) || ''
      : '';

    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: title || null,
        preview,
        message_count: 0,
      })
      .select()
      .single();

    if (createError) {
      return fail(ERROR_CODES.DATABASE_ERROR, createError.message, 500);
    }

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

      if (insertError) {
        return fail(ERROR_CODES.DATABASE_ERROR, insertError.message, 500);
      }
    }

    // 重新獲取對話（包含更新後的 metadata）
    const { data: finalConversation } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', newConversation.id)
      .single();

    return ok({ conversation: finalConversation });
  } catch (error: any) {
    console.error('[API Conversations] POST Error:', error);
    return serverError(typeof error === 'string' ? error : error?.message || 'Unknown error');
  }
}

export async function DELETE(request: Request) {
  try {
    // Ensure cookies are accessed correctly in Next.js App Router
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return unauthorized();
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return fail(ERROR_CODES.MISSING_FIELD, 'Missing conversation ID');
    }

    // 驗證對話屬於該用戶
    const { data: existingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (!existingConv) {
      return notFound('Conversation not found');
    }

    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (error) {
      return fail(ERROR_CODES.DATABASE_ERROR, error.message, 500);
    }

    return ok({ success: true });
  } catch (error: any) {
    console.error('[API Conversations] DELETE Error:', error);
    return serverError(typeof error === 'string' ? error : error?.message || 'Unknown error');
  }
}