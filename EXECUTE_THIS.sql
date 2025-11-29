-- ====================================
-- 完整 Profiles 表設定
-- 只需要複製這個檔案的內容到 Supabase SQL Editor 執行
-- ====================================

-- 1. 創建表（如果不存在）
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname text,
  avatar_url text,
  wechat_unionid text UNIQUE,
  wechat_openid text,
  wechat_nickname text,
  wechat_avatar text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. 添加缺少的欄位
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_avatar text;

-- 3. 更新現有記錄
UPDATE profiles SET updated_at = created_at WHERE updated_at IS NULL;

-- 4. 創建索引
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE INDEX IF NOT EXISTS profiles_nickname_idx ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);

-- 5. 啟用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. 創建 RLS 政策
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 7. 為現有用戶創建 profile 記錄
INSERT INTO profiles (id, nickname, created_at)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'nickname', '新用戶'),
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 8. 驗證設定
SELECT 'Tables' as type, table_name FROM information_schema.tables WHERE table_name = 'profiles'
UNION ALL
SELECT 'Columns', column_name FROM information_schema.columns WHERE table_name = 'profiles'
UNION ALL
SELECT 'Policies', policyname FROM pg_policies WHERE tablename = 'profiles';
