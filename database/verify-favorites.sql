-- ============================================================
-- 驗證 Favorites 表是否正確創建
-- ============================================================

-- 1. 查看表結構
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'favorites'
ORDER BY ordinal_position;

-- 2. 查看索引
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'favorites'
AND schemaname = 'public';

-- 3. 查看 RLS 政策
SELECT
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'favorites';
