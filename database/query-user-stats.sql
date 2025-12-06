-- =====================================================
-- 查詢實際用戶數據
-- 用途: 確認有多少用戶使用 Google 登入
-- =====================================================

-- 1. 查詢 auth.users 中的所有用戶
SELECT 
    COUNT(*) as total_auth_users,
    COUNT(CASE WHEN raw_app_meta_data->>'provider' = 'google' THEN 1 END) as google_users,
    COUNT(CASE WHEN raw_app_meta_data->>'provider' != 'google' THEN 1 END) as other_provider_users
FROM auth.users;

-- 2. 查看所有用戶的詳細信息
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

-- 3. 查詢 profiles 表中的用戶數
SELECT 
    COUNT(*) as total_profiles
FROM profiles;

-- 4. 查詢 conversations 表中的唯一用戶數
SELECT 
    COUNT(DISTINCT user_id) as unique_conversation_users
FROM conversations;

-- 5. 查詢最近 7 天活躍的唯一用戶
SELECT 
    COUNT(DISTINCT user_id) as active_users_last_7_days
FROM conversations
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 6. 查詢總對話數和總訊息數
SELECT 
    (SELECT COUNT(*) FROM conversations) as total_conversations,
    (SELECT COUNT(*) FROM conversation_messages) as total_messages;

-- 7. 列出所有用戶及其對話統計
SELECT 
    u.email,
    p.nickname,
    p.total_conversations,
    p.relationship_score,
    p.last_conversation_at,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY p.last_conversation_at DESC NULLS LAST;

-- 完成!
SELECT 'User data query completed!' AS status;
