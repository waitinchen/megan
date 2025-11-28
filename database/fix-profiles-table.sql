-- ============================================================
-- 修復 profiles 表：添加缺少的欄位
-- ============================================================

-- 1. 添加 updated_at 欄位（如果不存在）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. 添加 avatar_url 欄位（如果不存在）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3. 添加微信相關欄位（如果不存在）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_avatar text;

-- 4. 更新現有記錄的 updated_at（如果為 null）
UPDATE profiles
SET updated_at = created_at
WHERE updated_at IS NULL;

-- 5. 創建索引
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);

-- 6. 驗證欄位
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
