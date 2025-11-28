-- ============================================================
-- Favorites 表升級 v1.1
-- 添加內容哈希欄位用於防重複收藏
-- ============================================================

-- 添加 content_hash 欄位（可選，如果不添加，我們可以用 content 本身來檢查）
-- 為了更好的性能，可以添加一個 content_hash 欄位
-- 但為了簡化，我們直接用 content 欄位來檢查重複

-- 如果需要添加 content_hash 欄位，取消下面的註釋：
-- ALTER TABLE favorites 
-- ADD COLUMN IF NOT EXISTS content_hash text;

-- 創建唯一索引防止重複（基於 user_id 和 content）
-- 注意：這會阻止用戶收藏相同的內容，如果允許用戶重複收藏相同內容，則不需要這個索引
-- CREATE UNIQUE INDEX IF NOT EXISTS favorites_user_content_unique_idx 
-- ON favorites(user_id, content);

-- 或者創建一個部分唯一索引（只在同一時間段內防止重複）
-- 這裡我們採用軟檢查方式，不在資料庫層面強制唯一，而是在應用層面檢查

-- 為搜尋功能添加全文搜索索引（如果 Supabase 支援）
-- 注意：PostgreSQL 需要先啟用全文搜索擴展
-- CREATE INDEX IF NOT EXISTS favorites_content_fts_idx 
-- ON favorites USING gin(to_tsvector('simple', content));

-- 驗證
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '======================================';
    RAISE NOTICE '✅ Favorites 表升級 v1.1 準備完成！';
    RAISE NOTICE '======================================';
    RAISE NOTICE '';
    RAISE NOTICE '注意：此升級主要通過應用層邏輯實現，不需要資料庫結構變更';
    RAISE NOTICE '';
END $$;

