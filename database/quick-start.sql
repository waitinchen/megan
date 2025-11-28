-- ============================================================
-- Megan Phase 1 Quick Start - 最小化啟動 SQL
-- ============================================================
-- 此 SQL 會創建 Phase 1 必需的表，並設置基本的 RLS

-- ============================================================
-- 1. profiles 表（用戶基本資料）
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname text NOT NULL,
    email text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_conversation_at timestamp with time zone,
    total_conversations integer DEFAULT 0,
    relationship_score integer DEFAULT 0 CHECK (relationship_score >= 0 AND relationship_score <= 100)
);

-- 索引
CREATE INDEX IF NOT EXISTS profiles_nickname_idx ON profiles(nickname);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用戶可以查看和更新自己的資料
CREATE POLICY IF NOT EXISTS "用戶可以查看自己的資料" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "用戶可以更新自己的資料" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY IF NOT EXISTS "用戶可以插入自己的資料" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. conversations 表（對話記錄）
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    messages jsonb NOT NULL DEFAULT '[]'::jsonb,
    message_count integer DEFAULT 0,
    memory_extracted boolean DEFAULT false,
    started_at timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_started_at_idx ON conversations(started_at);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "用戶可以查看自己的對話" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "用戶可以插入自己的對話" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "用戶可以更新自己的對話" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- 3. 觸發器：自動更新對話數量
-- ============================================================

CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.message_count = jsonb_array_length(NEW.messages);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_message_count ON conversations;
CREATE TRIGGER trigger_update_message_count
    BEFORE INSERT OR UPDATE OF messages ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

-- ============================================================
-- 4. 觸發器：更新用戶最後對話時間
-- ============================================================

CREATE OR REPLACE FUNCTION update_user_last_conversation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET
        last_conversation_at = NEW.ended_at,
        total_conversations = total_conversations + 1,
        updated_at = now()
    WHERE id = NEW.user_id AND NEW.ended_at IS NOT NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_last_conversation ON conversations;
CREATE TRIGGER trigger_update_last_conversation
    AFTER INSERT OR UPDATE OF ended_at ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_conversation();

-- ============================================================
-- 完成！
-- ============================================================

-- 驗證表已創建
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('profiles', 'conversations')
ORDER BY table_name;
