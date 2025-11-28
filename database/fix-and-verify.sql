-- ============================================================
-- 修復並驗證 Supabase 數據庫
-- ============================================================

-- STEP 1: 先檢查 profiles 表是否存在
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
        RAISE NOTICE '✅ profiles 表已存在';

        -- 檢查欄位是否存在
        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'profiles'
            AND column_name = 'last_conversation_at'
        ) THEN
            RAISE NOTICE '✅ last_conversation_at 欄位已存在';
        ELSE
            RAISE NOTICE '⚠️  last_conversation_at 欄位不存在，將新增';
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_conversation_at timestamp with time zone;
        END IF;

        IF EXISTS (
            SELECT FROM information_schema.columns
            WHERE table_name = 'profiles'
            AND column_name = 'total_conversations'
        ) THEN
            RAISE NOTICE '✅ total_conversations 欄位已存在';
        ELSE
            RAISE NOTICE '⚠️  total_conversations 欄位不存在，將新增';
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_conversations integer DEFAULT 0;
        END IF;
    ELSE
        RAISE NOTICE '❌ profiles 表不存在，將創建';
    END IF;
END $$;

-- STEP 2: 創建或更新 profiles 表
CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nickname text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 確保欄位存在
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_conversation_at timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_conversations integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS relationship_score integer DEFAULT 0;

-- 添加約束（如果不存在）
DO $$
BEGIN
    ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_relationship_score_check;
    ALTER TABLE profiles ADD CONSTRAINT profiles_relationship_score_check
        CHECK (relationship_score >= 0 AND relationship_score <= 100);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 索引
CREATE INDEX IF NOT EXISTS profiles_nickname_idx ON profiles(nickname);
CREATE INDEX IF NOT EXISTS profiles_last_conversation_idx ON profiles(last_conversation_at);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用戶可以查看自己的資料" ON profiles;
DROP POLICY IF EXISTS "用戶可以更新自己的資料" ON profiles;
DROP POLICY IF EXISTS "用戶可以插入自己的資料" ON profiles;

CREATE POLICY "用戶可以查看自己的資料" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "用戶可以更新自己的資料" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "用戶可以插入自己的資料" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- STEP 3: 創建 conversations 表
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

CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_started_at_idx ON conversations(started_at);
CREATE INDEX IF NOT EXISTS conversations_memory_extracted_idx ON conversations(memory_extracted);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用戶可以查看自己的對話" ON conversations;
DROP POLICY IF EXISTS "用戶可以插入自己的對話" ON conversations;
DROP POLICY IF EXISTS "用戶可以更新自己的對話" ON conversations;

CREATE POLICY "用戶可以查看自己的對話" ON conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用戶可以插入自己的對話" ON conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用戶可以更新自己的對話" ON conversations
    FOR UPDATE USING (auth.uid() = user_id);

-- STEP 4: 創建函數和觸發器
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    NEW.message_count = jsonb_array_length(NEW.messages);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_user_last_conversation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ended_at IS NOT NULL THEN
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

DROP TRIGGER IF EXISTS trigger_update_message_count ON conversations;
CREATE TRIGGER trigger_update_message_count
    BEFORE INSERT OR UPDATE OF messages ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_message_count();

DROP TRIGGER IF EXISTS trigger_update_last_conversation ON conversations;
CREATE TRIGGER trigger_update_last_conversation
    AFTER INSERT OR UPDATE OF ended_at ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_conversation();

-- STEP 5: 最終驗證
DO $$
DECLARE
    profiles_cols integer;
    conversations_cols integer;
BEGIN
    -- 計算欄位數量
    SELECT COUNT(*) INTO profiles_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles';

    SELECT COUNT(*) INTO conversations_cols
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'conversations';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Phase 1 數據庫設置完成！';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ profiles 表：% 個欄位', profiles_cols;
    RAISE NOTICE '✅ conversations 表：% 個欄位', conversations_cols;
    RAISE NOTICE '✅ RLS 政策：已設置';
    RAISE NOTICE '✅ 觸發器：已創建';
    RAISE NOTICE '';
END $$;

-- 顯示表結構
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;
