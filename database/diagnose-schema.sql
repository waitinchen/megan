-- ============================================================
-- 診斷腳本: 檢查當前 Schema 狀態
-- ============================================================
-- 
-- 用途: 確認生產環境使用的 conversations 表結構
-- 執行: 在 Supabase SQL Editor 中執行
-- ============================================================

-- 1. 檢查 conversations 表結構
DO $$
DECLARE
    has_messages_jsonb boolean;
    has_conversation_messages_table boolean;
    has_ended_at boolean;
    has_triggers boolean;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔍 開始診斷 Conversations Schema';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- 檢查是否有 messages (JSONB) 欄位 (舊 Schema)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'messages'
    ) INTO has_messages_jsonb;

    -- 檢查是否有 conversation_messages 表 (新 Schema)
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'conversation_messages'
    ) INTO has_conversation_messages_table;

    -- 檢查是否有 ended_at 欄位
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'ended_at'
    ) INTO has_ended_at;

    -- 檢查觸發器
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'conversation_metadata_update_trigger'
    ) INTO has_triggers;

    -- 報告結果
    RAISE NOTICE '📊 Schema 檢查結果:';
    RAISE NOTICE '----------------------------------------';
    
    IF has_messages_jsonb THEN
        RAISE NOTICE '❌ 使用舊 Schema (messages JSONB)';
        RAISE NOTICE '   需要遷移到新 Schema!';
    ELSE
        RAISE NOTICE '✅ 沒有 messages JSONB 欄位';
    END IF;

    IF has_conversation_messages_table THEN
        RAISE NOTICE '✅ 使用新 Schema (conversation_messages 表)';
    ELSE
        RAISE NOTICE '❌ 缺少 conversation_messages 表';
        RAISE NOTICE '   需要創建新 Schema!';
    END IF;

    IF has_ended_at THEN
        RAISE NOTICE '✅ 有 ended_at 欄位';
    ELSE
        RAISE NOTICE '⚠️  缺少 ended_at 欄位';
        RAISE NOTICE '   需要添加此欄位!';
    END IF;

    IF has_triggers THEN
        RAISE NOTICE '✅ 觸發器已安裝';
    ELSE
        RAISE NOTICE '⚠️  缺少觸發器';
        RAISE NOTICE '   需要創建觸發器!';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📋 詳細欄位列表:';
    RAISE NOTICE '========================================';
END $$;

-- 2. 顯示 conversations 表的所有欄位
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'conversations'
ORDER BY ordinal_position;

-- 3. 檢查觸發器
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('conversations', 'conversation_messages');

-- 4. 檢查 RLS 政策
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename IN ('conversations', 'conversation_messages')
ORDER BY tablename, policyname;

-- 5. 統計數據
SELECT 
    'conversations' as table_name,
    COUNT(*) as total_rows
FROM conversations
UNION ALL
SELECT 
    'conversation_messages' as table_name,
    COUNT(*) as total_rows
FROM conversation_messages;
