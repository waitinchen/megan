-- =====================================================
-- 診斷並修復用戶列表問題
-- 問題: 管理後台只顯示 1 個用戶,但有 85 個活躍用戶
-- 原因: profiles 表缺少記錄
-- =====================================================

-- 1. 檢查 auth.users 中的用戶數量
SELECT 
    'auth.users' as table_name,
    COUNT(*) as user_count
FROM auth.users;

-- 2. 檢查 profiles 表中的用戶數量
SELECT 
    'profiles' as table_name,
    COUNT(*) as user_count
FROM profiles;

-- 3. 找出沒有 profile 的用戶
SELECT 
    u.id,
    u.email,
    u.created_at as user_created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL
ORDER BY u.created_at DESC;

-- 4. 檢查是否有自動創建 profile 的觸發器
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
AND event_object_table = 'users';

-- =====================================================
-- 修復方案: 為所有缺少 profile 的用戶創建 profile
-- =====================================================

-- 5. 為所有沒有 profile 的用戶創建 profile
INSERT INTO profiles (id, nickname, avatar_url, total_conversations, relationship_score, created_at, updated_at)
SELECT 
    u.id,
    COALESCE(u.raw_user_meta_data->>'name', u.email) as nickname,
    u.raw_user_meta_data->>'avatar_url' as avatar_url,
    0 as total_conversations,
    0 as relationship_score,
    u.created_at,
    NOW() as updated_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 6. 更新 total_conversations 從 conversations 表
UPDATE profiles p
SET total_conversations = (
    SELECT COUNT(*)
    FROM conversations c
    WHERE c.user_id = p.id
),
updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM conversations c WHERE c.user_id = p.id
);

-- 7. 更新 last_conversation_at
UPDATE profiles p
SET last_conversation_at = (
    SELECT MAX(created_at)
    FROM conversations c
    WHERE c.user_id = p.id
),
updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM conversations c WHERE c.user_id = p.id
);

-- 8. 驗證結果
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

-- 9. 查看前 10 個用戶
SELECT 
    p.id,
    u.email,
    p.nickname,
    p.total_conversations,
    p.relationship_score,
    p.last_conversation_at,
    p.created_at
FROM profiles p
JOIN auth.users u ON p.id = u.id
ORDER BY p.last_conversation_at DESC NULLS LAST
LIMIT 10;

-- 完成!
SELECT 'User profiles synchronized!' AS status;
