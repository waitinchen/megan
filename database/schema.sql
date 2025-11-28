-- ============================================================
-- Megan Memory System - Supabase Database Schema v1.0
-- ============================================================

-- 此 schema 與 Cloudflare KV 配合使用
-- KV 儲存：快速記憶（profile, preferences, relationship, longterm）
-- Supabase 儲存：對話紀錄、每日摘要、用戶管理

-- ============================================================
-- 1. profiles 表（用戶基本資料）- 已存在，補充欄位
-- ============================================================

-- 檢查 profiles 表是否存在
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'profiles') THEN
        CREATE TABLE profiles (
            id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            nickname text NOT NULL,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
    END IF;
END $$;

-- 補充新欄位（如果不存在）
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS estimated_age integer,
ADD COLUMN IF NOT EXISTS estimated_gender text,
ADD COLUMN IF NOT EXISTS estimated_occupation text,
ADD COLUMN IF NOT EXISTS last_conversation_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS total_conversations integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS relationship_score integer DEFAULT 0 CHECK (relationship_score >= 0 AND relationship_score <= 100);

-- 索引
CREATE INDEX IF NOT EXISTS profiles_nickname_idx ON profiles(nickname);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_last_conversation_idx ON profiles(last_conversation_at);

-- RLS（Row Level Security）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用戶只能查看自己的資料
DROP POLICY IF EXISTS "用戶只能查看自己的資料" ON profiles;
CREATE POLICY "用戶只能查看自己的資料"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- 用戶可以更新自己的資料
DROP POLICY IF EXISTS "用戶可以更新自己的資料" ON profiles;
CREATE POLICY "用戶可以更新自己的資料"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- 用戶可以插入自己的資料
DROP POLICY IF EXISTS "用戶可以插入自己的資料" ON profiles;
CREATE POLICY "用戶可以插入自己的資料"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. conversations 表（對話會話記錄）
-- ============================================================

CREATE TABLE IF NOT EXISTS conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 對話內容（JSON 格式）
    messages jsonb NOT NULL DEFAULT '[]'::jsonb,

    -- 對話摘要（可選，由 GPT 生成）
    summary text,

    -- 對話統計
    message_count integer DEFAULT 0,
    avg_emotion_score numeric(3, 2) CHECK (avg_emotion_score >= 0 AND avg_emotion_score <= 1),

    -- 是否已經提取記憶
    memory_extracted boolean DEFAULT false,

    -- 時間戳
    started_at timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),

    -- 元數據
    metadata jsonb DEFAULT '{}'::jsonb
);

-- 索引
CREATE INDEX IF NOT EXISTS conversations_user_id_idx ON conversations(user_id);
CREATE INDEX IF NOT EXISTS conversations_started_at_idx ON conversations(started_at);
CREATE INDEX IF NOT EXISTS conversations_memory_extracted_idx ON conversations(memory_extracted);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用戶只能查看自己的對話" ON conversations;
CREATE POLICY "用戶只能查看自己的對話"
    ON conversations FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "用戶可以插入自己的對話" ON conversations;
CREATE POLICY "用戶可以插入自己的對話"
    ON conversations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "用戶可以更新自己的對話" ON conversations;
CREATE POLICY "用戶可以更新自己的對話"
    ON conversations FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================================
-- 3. daily_summaries 表（每日摘要）
-- ============================================================

CREATE TABLE IF NOT EXISTS daily_summaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- 日期（唯一）
    date date NOT NULL,

    -- 情緒趨勢（JSON 格式）
    emotion_trend jsonb DEFAULT '[]'::jsonb,
    -- 範例：[{"time": "09:00", "happiness": 0.7, "anxiety": 0.3}, ...]

    -- Megan 學到的新東西
    new_learnings text[] DEFAULT ARRAY[]::text[],

    -- 關係更新
    relationship_update text,

    -- 新發現的偏好
    new_preferences jsonb DEFAULT '[]'::jsonb,

    -- 是否應該合併到長期記憶
    should_merge_to_longterm boolean DEFAULT false,

    -- 是否已經合併
    merged_to_longterm boolean DEFAULT false,

    -- 摘要文字
    summary text,

    -- 時間戳
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    -- 確保每個用戶每天只有一個摘要
    UNIQUE(user_id, date)
);

-- 索引
CREATE INDEX IF NOT EXISTS daily_summaries_user_id_idx ON daily_summaries(user_id);
CREATE INDEX IF NOT EXISTS daily_summaries_date_idx ON daily_summaries(date);
CREATE INDEX IF NOT EXISTS daily_summaries_should_merge_idx ON daily_summaries(should_merge_to_longterm);

-- RLS
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用戶只能查看自己的每日摘要" ON daily_summaries;
CREATE POLICY "用戶只能查看自己的每日摘要"
    ON daily_summaries FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
-- 4. memory_extraction_jobs 表（記憶提取任務隊列）
-- ============================================================

CREATE TABLE IF NOT EXISTS memory_extraction_jobs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,

    -- 任務狀態
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

    -- 錯誤訊息（如果失敗）
    error_message text,

    -- 提取結果（JSON）
    extracted_memories jsonb,

    -- 排程時間
    scheduled_at timestamp with time zone DEFAULT now(),

    -- 開始處理時間
    started_at timestamp with time zone,

    -- 完成時間
    completed_at timestamp with time zone,

    -- 創建時間
    created_at timestamp with time zone DEFAULT now(),

    -- 元數據
    metadata jsonb DEFAULT '{}'::jsonb
);

-- 索引
CREATE INDEX IF NOT EXISTS memory_jobs_user_id_idx ON memory_extraction_jobs(user_id);
CREATE INDEX IF NOT EXISTS memory_jobs_status_idx ON memory_extraction_jobs(status);
CREATE INDEX IF NOT EXISTS memory_jobs_scheduled_idx ON memory_extraction_jobs(scheduled_at);

-- RLS
ALTER TABLE memory_extraction_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用戶只能查看自己的提取任務" ON memory_extraction_jobs;
CREATE POLICY "用戶只能查看自己的提取任務"
    ON memory_extraction_jobs FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
-- 5. kv_sync_log 表（KV 同步日誌）
-- ============================================================

-- 記錄 Cloudflare KV 與 Supabase 之間的同步狀態

CREATE TABLE IF NOT EXISTS kv_sync_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- KV Key
    kv_key text NOT NULL,

    -- 操作類型
    operation text NOT NULL CHECK (operation IN ('read', 'write', 'delete')),

    -- 同步狀態
    status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failed')),

    -- 錯誤訊息
    error_message text,

    -- 時間戳
    created_at timestamp with time zone DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS kv_sync_log_user_id_idx ON kv_sync_log(user_id);
CREATE INDEX IF NOT EXISTS kv_sync_log_created_at_idx ON kv_sync_log(created_at);

-- RLS
ALTER TABLE kv_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用戶只能查看自己的同步日誌" ON kv_sync_log;
CREATE POLICY "用戶只能查看自己的同步日誌"
    ON kv_sync_log FOR SELECT
    USING (auth.uid() = user_id);

-- ============================================================
-- 6. 實用函數（Stored Procedures）
-- ============================================================

-- 6.1 更新用戶最後對話時間
CREATE OR REPLACE FUNCTION update_user_last_conversation()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles
    SET
        last_conversation_at = NEW.ended_at,
        total_conversations = total_conversations + 1,
        updated_at = now()
    WHERE id = NEW.user_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 創建觸發器
DROP TRIGGER IF EXISTS trigger_update_last_conversation ON conversations;
CREATE TRIGGER trigger_update_last_conversation
    AFTER INSERT OR UPDATE OF ended_at ON conversations
    FOR EACH ROW
    WHEN (NEW.ended_at IS NOT NULL)
    EXECUTE FUNCTION update_user_last_conversation();

-- 6.2 自動計算對話訊息數量
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

-- 6.3 取得用戶統計數據
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id uuid)
RETURNS TABLE(
    total_conversations bigint,
    total_messages bigint,
    avg_messages_per_conversation numeric,
    total_summaries bigint,
    relationship_score integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT c.id)::bigint as total_conversations,
        COALESCE(SUM(c.message_count), 0)::bigint as total_messages,
        COALESCE(AVG(c.message_count), 0)::numeric as avg_messages_per_conversation,
        COUNT(DISTINCT ds.id)::bigint as total_summaries,
        COALESCE(p.relationship_score, 0) as relationship_score
    FROM profiles p
    LEFT JOIN conversations c ON c.user_id = p.id
    LEFT JOIN daily_summaries ds ON ds.user_id = p.id
    WHERE p.id = p_user_id
    GROUP BY p.id, p.relationship_score;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. 初始化數據（可選）
-- ============================================================

-- 為現有用戶創建預設記憶結構（如果需要）
-- 這會在用戶首次登入時自動執行

-- ============================================================
-- 8. 管理員視圖（Admin Views）
-- ============================================================

-- 8.1 用戶總覽視圖
CREATE OR REPLACE VIEW admin_user_overview AS
SELECT
    p.id,
    p.nickname,
    p.email,
    p.created_at,
    p.last_conversation_at,
    p.total_conversations,
    p.relationship_score,
    COUNT(DISTINCT c.id) as conversation_count,
    COUNT(DISTINCT ds.id) as summary_count,
    COALESCE(SUM(c.message_count), 0) as total_messages
FROM profiles p
LEFT JOIN conversations c ON c.user_id = p.id
LEFT JOIN daily_summaries ds ON ds.user_id = p.id
GROUP BY p.id;

-- 8.2 待處理任務視圖
CREATE OR REPLACE VIEW admin_pending_tasks AS
SELECT
    'memory_extraction' as task_type,
    mej.id,
    mej.user_id,
    p.nickname,
    mej.status,
    mej.scheduled_at,
    mej.created_at
FROM memory_extraction_jobs mej
JOIN profiles p ON p.id = mej.user_id
WHERE mej.status IN ('pending', 'processing')

UNION ALL

SELECT
    'daily_summary' as task_type,
    ds.id,
    ds.user_id,
    p.nickname,
    CASE
        WHEN ds.should_merge_to_longterm AND NOT ds.merged_to_longterm THEN 'pending_merge'
        ELSE 'completed'
    END as status,
    ds.created_at as scheduled_at,
    ds.created_at
FROM daily_summaries ds
JOIN profiles p ON p.id = ds.user_id
WHERE ds.should_merge_to_longterm AND NOT ds.merged_to_longterm;

-- ============================================================
-- 完成！
-- ============================================================

-- 執行此檔案：
-- psql -U postgres -d your_database -f schema.sql
-- 或在 Supabase Dashboard 的 SQL Editor 中執行

COMMENT ON TABLE profiles IS 'Megan 用戶基本資料';
COMMENT ON TABLE conversations IS 'Megan 對話會話記錄';
COMMENT ON TABLE daily_summaries IS 'Megan 每日摘要';
COMMENT ON TABLE memory_extraction_jobs IS 'Megan 記憶提取任務隊列';
COMMENT ON TABLE kv_sync_log IS 'Cloudflare KV 同步日誌';
