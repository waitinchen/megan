-- ============================================================
-- 修復 conversations 表結構
-- 添加缺失的 preview, title, last_message_at 等列
-- ============================================================

-- 檢查並添加缺失的列
DO $$
BEGIN
    -- 添加 preview 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'preview'
    ) THEN
        ALTER TABLE conversations ADD COLUMN preview text;
        RAISE NOTICE '✅ 添加 preview 列';
    ELSE
        RAISE NOTICE '⏭️  preview 列已存在';
    END IF;

    -- 添加 title 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'title'
    ) THEN
        ALTER TABLE conversations ADD COLUMN title text;
        RAISE NOTICE '✅ 添加 title 列';
    ELSE
        RAISE NOTICE '⏭️  title 列已存在';
    END IF;

    -- 添加 last_message_at 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'last_message_at'
    ) THEN
        ALTER TABLE conversations ADD COLUMN last_message_at timestamp with time zone DEFAULT now();
        RAISE NOTICE '✅ 添加 last_message_at 列';
    ELSE
        RAISE NOTICE '⏭️  last_message_at 列已存在';
    END IF;

    -- 添加 updated_at 列（如果不存在）
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE conversations ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        RAISE NOTICE '✅ 添加 updated_at 列';
    ELSE
        RAISE NOTICE '⏭️  updated_at 列已存在';
    END IF;
END $$;

-- 創建索引（如果不存在）
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at DESC);

-- 驗證
DO $$
DECLARE
    col_count integer;
BEGIN
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_name = 'conversations'
    AND column_name IN ('preview', 'title', 'last_message_at', 'updated_at');

    RAISE NOTICE '';
    RAISE NOTICE '====================================';
    RAISE NOTICE '✅ Conversations 表修復完成！';
    RAISE NOTICE '====================================';
    RAISE NOTICE '找到 % 個必需列', col_count;
    RAISE NOTICE '';
END $$;
