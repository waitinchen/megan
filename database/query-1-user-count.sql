-- =====================================================
-- 查詢 1: 用戶總數和認證方式
-- =====================================================

SELECT 
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN raw_app_meta_data->>'provider' = 'google' THEN 1 END) as google_users,
    COUNT(CASE WHEN raw_app_meta_data->>'provider' != 'google' THEN 1 END) as other_provider_users
FROM auth.users;

-- 執行這個查詢後,請截圖給我看結果
-- 然後再執行下一個查詢
