-- ============================================================
-- 完整重建 Conversations 和 Conversation Messages 表
-- ============================================================

-- 1. 刪除舊表 (如果存在)
DROP TABLE IF EXISTS conversation_messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- 2. 創建 conversations 表
CREATE TABLE conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text,
    preview text,
    message_count integer DEFAULT 0,
    last_message_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. 創建 conversation_messages 表
CREATE TABLE conversation_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    emotion text[],
    audio_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- 4. 創建索引
CREATE INDEX conversations_user_id_idx ON conversations(user_id);
CREATE INDEX conversations_last_message_at_idx ON conversations(last_message_at DESC);
CREATE INDEX conversations_created_at_idx ON conversations(created_at DESC);
CREATE INDEX conversation_messages_conversation_id_idx ON conversation_messages(conversation_id);
CREATE INDEX conversation_messages_created_at_idx ON conversation_messages(created_at);

-- 5. 啟用 RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- 6. 創建 RLS 政策 - Conversations
DROP POLICY IF EXISTS "用戶可以查看自己的對話" ON conversations;
CREATE POLICY "用戶可以查看自己的對話" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用戶可以創建對話" ON conversations;
CREATE POLICY "用戶可以創建對話" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用戶可以更新自己的對話" ON conversations;
CREATE POLICY "用戶可以更新自己的對話" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用戶可以刪除自己的對話" ON conversations;
CREATE POLICY "用戶可以刪除自己的對話" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- 7. 創建 RLS 政策 - Conversation Messages
DROP POLICY IF EXISTS "用戶可以查看自己對話的訊息" ON conversation_messages;
CREATE POLICY "用戶可以查看自己對話的訊息" ON conversation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "用戶可以新增訊息到自己對話" ON conversation_messages;
CREATE POLICY "用戶可以新增訊息到自己對話" ON conversation_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "用戶可以刪除自己對話的訊息" ON conversation_messages;
CREATE POLICY "用戶可以刪除自己對話的訊息" ON conversation_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

-- 8. 創建觸發器函數
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET 
        last_message_at = now(),
        message_count = (
            SELECT COUNT(*) 
            FROM conversation_messages 
            WHERE conversation_id = NEW.conversation_id
        )
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. 創建觸發器
DROP TRIGGER IF EXISTS conversation_messages_update_trigger ON conversation_messages;
CREATE TRIGGER conversation_messages_update_trigger
    AFTER INSERT OR UPDATE ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

DROP TRIGGER IF EXISTS conversation_metadata_update_trigger ON conversation_messages;
CREATE TRIGGER conversation_metadata_update_trigger
    AFTER INSERT ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_metadata();

-- 10. 驗證
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '======================================';
    RAISE NOTICE '✅ Conversations 表重建完成！';
    RAISE NOTICE '======================================';
    RAISE NOTICE '';
END $$;
