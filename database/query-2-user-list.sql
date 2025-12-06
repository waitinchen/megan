-- =====================================================
-- 查詢 2: 所有用戶詳細列表
-- =====================================================

SELECT 
    id,
    email,
    raw_app_meta_data->>'provider' as auth_provider,
    raw_user_meta_data->>'name' as user_name,
    raw_user_meta_data->>'avatar_url' as avatar_url,
    created_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 執行這個查詢後,請截圖給我看結果
