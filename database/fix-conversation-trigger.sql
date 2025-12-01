-- ============================================================
-- 修復對話計數觸發器
-- ============================================================
-- 
-- 問題: 原觸發器只在 ended_at 不為 NULL 時觸發,但 API 從未設置 ended_at
-- 解決: 改為在 INSERT 時計數,UPDATE ended_at 時更新時間
--
-- 執行方式: 在 Supabase SQL Editor 中執行此腳本
-- ============================================================

-- 1. 刪除舊觸發器
DROP TRIGGER IF EXISTS trigger_update_last_conversation ON conversations;

-- 2. 創建新的觸發器函數
CREATE OR REPLACE FUNCTION update_user_last_conversation()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 新對話創建時: 計數 +1, 更新最後對話時間
        UPDATE profiles
        SET
            last_conversation_at = NEW.created_at,
            total_conversations = COALESCE(total_conversations, 0) + 1,
            updated_at = now()
        WHERE id = NEW.user_id;
        
        RAISE NOTICE '✅ 新對話創建: user_id=%, conversation_id=%', NEW.user_id, NEW.id;
        
    ELSIF TG_OP = 'UPDATE' AND NEW.ended_at IS NOT NULL AND OLD.ended_at IS NULL THEN
        -- 對話結束時: 只更新最後對話時間
        UPDATE profiles
        SET
            last_conversation_at = NEW.ended_at,
            updated_at = now()
        WHERE id = NEW.user_id;
        
        RAISE NOTICE '✅ 對話結束: user_id=%, conversation_id=%', NEW.user_id, NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 創建新觸發器
CREATE TRIGGER trigger_update_last_conversation
    AFTER INSERT OR UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_user_last_conversation();

-- 4. 驗證觸發器
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ 觸發器已更新';
    RAISE NOTICE '========================================';
    RAISE NOTICE '新邏輯:';
    RAISE NOTICE '  - INSERT: total_conversations +1';
    RAISE NOTICE '  - UPDATE (ended_at): 更新 last_conversation_at';
    RAISE NOTICE '========================================';
END $$;
