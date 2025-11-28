-- ============================================================
-- Conversations 表（對話歷史）
-- ============================================================

-- 主對話表
CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text, -- 對話標題（自動生成或用戶自定義）
    preview text, -- 預覽文字（第一條訊息）
    message_count integer DEFAULT 0, -- 訊息數量
    last_message_at timestamp with time zone DEFAULT now(), -- 最後訊息時間
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 對話訊息表
CREATE TABLE IF NOT EXISTS conversation_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    content text NOT NULL,
    emotion text[], -- 情緒標籤陣列
    audio_url text, -- Base64 音頻數據（可選，存儲較大，建議未來改用外部存儲）
    created_at timestamp with time zone DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_created_at_idx ON conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS conversation_messages_conversation_id_idx ON conversation_messages(conversation_id);
CREATE INDEX IF NOT EXISTS conversation_messages_created_at_idx ON conversation_messages(created_at);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- 刪除舊政策
DROP POLICY IF EXISTS "用戶可以查看自己的對話" ON conversations;
DROP POLICY IF EXISTS "用戶可以創建對話" ON conversations;
DROP POLICY IF EXISTS "用戶可以更新自己的對話" ON conversations;
DROP POLICY IF EXISTS "用戶可以刪除自己的對話" ON conversations;

DROP POLICY IF EXISTS "用戶可以查看自己對話的訊息" ON conversation_messages;
DROP POLICY IF EXISTS "用戶可以新增訊息到自己對話" ON conversation_messages;
DROP POLICY IF EXISTS "用戶可以刪除自己對話的訊息" ON conversation_messages;

-- Conversations 表政策
CREATE POLICY "用戶可以查看自己的對話" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用戶可以創建對話" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用戶可以更新自己的對話" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用戶可以刪除自己的對話" ON conversations
    FOR DELETE USING (auth.uid() = user_id);

-- Conversation Messages 表政策
CREATE POLICY "用戶可以查看自己對話的訊息" ON conversation_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "用戶可以新增訊息到自己對話" ON conversation_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

CREATE POLICY "用戶可以刪除自己對話的訊息" ON conversation_messages
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM conversations
            WHERE conversations.id = conversation_messages.conversation_id
            AND conversations.user_id = auth.uid()
        )
    );

-- 自動更新 updated_at 的觸發器
CREATE OR REPLACE FUNCTION update_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversations
    SET updated_at = now()
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER conversation_messages_update_trigger
    AFTER INSERT OR UPDATE ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_updated_at();

-- 自動更新 last_message_at 和 message_count 的觸發器
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

CREATE TRIGGER conversation_metadata_update_trigger
    AFTER INSERT ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_metadata();

-- 驗證
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '======================================';
    RAISE NOTICE '✅ Conversations 表創建完成！';
    RAISE NOTICE '======================================';
    RAISE NOTICE '';
    RAISE NOTICE '包含：';
    RAISE NOTICE '  - conversations 表（對話主表）';
    RAISE NOTICE '  - conversation_messages 表（訊息表）';
    RAISE NOTICE '  - RLS 安全政策';
    RAISE NOTICE '  - 自動更新觸發器';
    RAISE NOTICE '';
END $$;

