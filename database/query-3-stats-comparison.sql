-- =====================================================
-- 查詢 3: 統計數據對比
-- =====================================================

SELECT 
    'auth.users' as source,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'profiles' as source,
    COUNT(*) as count
FROM profiles
UNION ALL
SELECT 
    'conversations (distinct users)' as source,
    COUNT(DISTINCT user_id) as count
FROM conversations;

-- 執行這個查詢後,請截圖給我看結果
