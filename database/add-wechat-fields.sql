-- ============================================================
-- 添加微信 OAuth 相關欄位到 profiles 表
-- ============================================================

-- 添加微信相關欄位
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_avatar text;

-- 添加註釋
COMMENT ON COLUMN profiles.wechat_unionid IS '微信 UnionID (同一開放平台下唯一)';
COMMENT ON COLUMN profiles.wechat_openid IS '微信 OpenID (單一應用下唯一)';
COMMENT ON COLUMN profiles.wechat_nickname IS '微信暱稱';
COMMENT ON COLUMN profiles.wechat_avatar IS '微信頭像 URL';

-- 創建索引提升查詢效率
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);

-- 驗證欄位
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name LIKE 'wechat%'
ORDER BY ordinal_position;
