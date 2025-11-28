-- ============================================================
-- Megan Phase 1 Quick Start v4 - 分步驟執行版
-- ============================================================
-- 修正：先創建表，再創建觸發器

-- ============================================================
-- STEP 1: 創建 profiles 表
-- ============================================================

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_conversation_at timestamp with time zone,
    total_conversations integer DEFAULT 0,
    relationship_score integer DEFAULT 0 CHECK (relationship_score >= 0 AND relationship_score <= 100)
);

-- 索引
CREATE INDEX IF NOT EXISTS profiles_nickname_idx ON profiles(nickname);
CREATE INDEX IF NOT EXISTS profiles_last_conversation_idx ON profiles(last_conversation_at);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 刪除舊政策
DROP POLICY IF EXISTS "用戶可以查看自己的資料" ON profiles;
DROP POLICY IF EXISTS "用戶可以更新自己的資料" ON profiles;
DROP POLICY IF EXISTS "用戶可以插入自己的資料" ON profiles;

-- 創建新政策
CREATE POLICY "用戶可以查看自己的資料" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用戶可以更新自己的資料" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用戶可以插入自己的資料" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- STEP 2: 創建 conversations 表
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
CREATE INDEX IF NOT EXISTS conversations_memory_extracted_idx ON conversations(memory_extracted);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 刪除舊政策
DROP POLICY IF EXISTS "用戶可以查看自己的對話" ON conversations;
DROP POLICY IF EXISTS "用戶可以插入自己的對話" ON conversations;
DROP POLICY IF EXISTS "用戶可以更新自己的對話" ON conversations;

-- 創建新政策
CREATE POLICY "用戶可以查看自己的對話" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用戶可以插入自己的對話" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用戶可以更新自己的對話" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================
-- STEP 3: 創建函數（先創建函數定義）
-- ============================================================

-- 函數 1: 自動更新對話數量
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.message_count = jsonb_array_length(NEW.messages);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 函數 2: 更新用戶最後對話時間
CREATE OR REPLACE FUNCTION update_user_last_conversation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ended_at IS NOT NULL THEN
        -- 使用 UPDATE 更新 profiles 表
        UPDATE profiles
        SET
            last_conversation_at = NEW.ended_at,
            total_conversations = COALESCE(total_conversations, 0) + 1,
            updated_at = now()
        WHERE id = NEW.user_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STEP 4: 創建觸發器
-- ============================================================

-- 觸發器 1: 自動計算 message_count
DROP TRIGGER IF EXISTS trigger_update_message_count ON conversations;
CREATE TRIGGER trigger_update_message_count
    BEFORE INSERT OR UPDATE OF messages ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

-- 觸發器 2: 更新用戶最後對話時間
DROP TRIGGER IF EXISTS trigger_update_last_conversation ON conversations;
CREATE TRIGGER trigger_update_last_conversation
    AFTER INSERT OR UPDATE OF ended_at ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_conversation();

-- ============================================================
-- STEP 5: 驗證
-- ============================================================

-- 顯示成功訊息
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Phase 1 數據庫設置完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ profiles 表：已創建';
    RAISE NOTICE '✅ conversations 表：已創建';
    RAISE NOTICE '✅ RLS 政策：已設置';
    RAISE NOTICE '✅ 觸發器：已創建';
    RAISE NOTICE '';
    RAISE NOTICE '下一步：查看表結構';
    RAISE NOTICE '';
END $$;

-- 查看表結構
SELECT
    'profiles' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'

UNION ALL

SELECT
    'conversations' as table_name,
    COUNT(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'conversations'

ORDER BY table_name;
