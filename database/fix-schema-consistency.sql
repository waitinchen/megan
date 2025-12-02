-- ============================================================
-- 修復腳本: 確保 Schema 一致性
-- ============================================================
-- 
-- 用途: 修復 conversations 表,確保所有必要欄位存在
-- 執行: 在確認診斷結果後執行
-- 
-- ⚠️ 警告: 此腳本會修改表結構,請先備份數據!
-- ============================================================

-- 1. 添加缺少的欄位 (如果不存在)
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 開始修復 Schema';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';

    -- 添加 ended_at 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'ended_at'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN ended_at timestamptz;
        RAISE NOTICE '✅ 已添加 ended_at 欄位';
    ELSE
        RAISE NOTICE '✓ ended_at 欄位已存在';
    END IF;

    -- 確保 title 欄位存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'title'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN title text;
        RAISE NOTICE '✅ 已添加 title 欄位';
    ELSE
        RAISE NOTICE '✓ title 欄位已存在';
    END IF;

    -- 確保 preview 欄位存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'preview'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN preview text;
        RAISE NOTICE '✅ 已添加 preview 欄位';
    ELSE
        RAISE NOTICE '✓ preview 欄位已存在';
    END IF;

    -- 確保 message_count 欄位存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'message_count'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN message_count integer DEFAULT 0;
        RAISE NOTICE '✅ 已添加 message_count 欄位';
    ELSE
        RAISE NOTICE '✓ message_count 欄位已存在';
    END IF;

    -- 確保 last_message_at 欄位存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE conversations 
        ADD COLUMN last_message_at timestamptz DEFAULT now();
        RAISE NOTICE '✅ 已添加 last_message_at 欄位';
    ELSE
        RAISE NOTICE '✓ last_message_at 欄位已存在';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Schema 修復完成';
    RAISE NOTICE '========================================';
END $$;

-- 2. 創建或更新觸發器函數
CREATE OR REPLACE FUNCTION update_conversation_metadata()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 插入訊息時: 增量更新
        UPDATE conversations
        SET 
            last_message_at = now(),
            message_count = message_count + 1,
            updated_at = now()
        WHERE id = NEW.conversation_id;
    ELSIF TG_OP = 'DELETE' THEN
        -- 刪除訊息時: 減量更新
        UPDATE conversations
        SET 
            last_message_at = COALESCE(
                (SELECT MAX(created_at) FROM conversation_messages WHERE conversation_id = OLD.conversation_id),
                now()
            ),
            message_count = GREATEST(message_count - 1, 0),
            updated_at = now()
        WHERE id = OLD.conversation_id;
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 3. 創建或更新觸發器
DROP TRIGGER IF EXISTS conversation_metadata_update_trigger ON conversation_messages;
CREATE TRIGGER conversation_metadata_update_trigger
    AFTER INSERT OR DELETE ON conversation_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_metadata();

-- 4. 驗證修復結果
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧪 驗證修復結果';
    RAISE NOTICE '========================================';
    
    -- 檢查所有必要欄位
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name IN ('ended_at', 'title', 'preview', 'message_count', 'last_message_at')
        GROUP BY table_name
        HAVING COUNT(*) = 5
    ) THEN
        RAISE NOTICE '✅ 所有必要欄位都存在';
    ELSE
        RAISE NOTICE '❌ 仍有欄位缺失';
    END IF;

    -- 檢查觸發器
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'conversation_metadata_update_trigger'
    ) THEN
        RAISE NOTICE '✅ 觸發器已安裝';
    ELSE
        RAISE NOTICE '❌ 觸發器缺失';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 驗證完成';
    RAISE NOTICE '========================================';
END $$;
