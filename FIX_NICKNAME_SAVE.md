# 🔧 修復暱稱保存問題

## 問題：暱稱保存失敗，刷新後變空白

### 可能原因

1. **Profiles 表缺少欄位** - 資料庫 schema 不完整
2. **RLS 政策問題** - 沒有權限更新 profiles
3. **用戶記錄不存在** - profiles 表中沒有該用戶的記錄

---

## ✅ 解決方案

### 步驟 1: 確保 Profiles 表結構完整

前往 **Supabase Dashboard > SQL Editor**

執行以下 SQL（確保所有必要欄位存在）：

```sql
-- 1. 檢查 profiles 表是否存在
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

-- 2. 添加缺少的欄位（如果之前的表已存在）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_avatar text;

-- 3. 更新現有記錄
UPDATE profiles
SET updated_at = created_at
WHERE updated_at IS NULL;

-- 4. 創建索引
CREATE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE INDEX IF NOT EXISTS profiles_nickname_idx ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);

-- 5. 驗證表結構
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

---

### 步驟 2: 設定 RLS 政策

確保用戶可以查看和更新自己的 profile：

```sql
-- 啟用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 刪除舊政策（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- 1. 允許用戶查看自己的 profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. 允許用戶更新自己的 profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. 允許用戶創建自己的 profile
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 4. 驗證政策
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
```

---

### 步驟 3: 創建缺失的用戶記錄

如果某些用戶的 profile 記錄不存在：

```sql
-- 為所有已註冊但沒有 profile 的用戶創建記錄
INSERT INTO profiles (id, nickname, created_at)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'nickname', '新用戶'),
  created_at
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);

-- 驗證所有用戶都有 profile
SELECT
  u.id,
  u.email,
  p.nickname,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

---

### 步驟 4: 測試暱稱保存

1. 前往：https://megan.tonetown.ai/dashboard/profile
2. 輸入新暱稱，例如：`測試暱稱`
3. 點擊 **"保存"**
4. 應該看到成功訊息：`暱稱更新成功！Megan 會立即使用新暱稱稱呼你 ✨`
5. 重新整理頁面
6. ✅ 暱稱應該保持不變

---

## 🔍 診斷步驟

### 檢查 1: 驗證表結構

```sql
-- 查看 profiles 表的所有欄位
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
```

**預期結果**：應該包含這些欄位
- `id` (uuid)
- `nickname` (text)
- `avatar_url` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `wechat_*` 欄位（微信登入用）

### 檢查 2: 驗證當前用戶的記錄

在瀏覽器 Console（F12）執行：

```javascript
// 獲取當前用戶 ID
const { data } = await supabase.auth.getUser();
console.log('User ID:', data.user.id);

// 查詢 profile
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', data.user.id)
  .single();

console.log('Profile:', profile);
console.log('Error:', error);
```

**預期結果**：
- 應該返回 profile 物件
- `nickname` 欄位應該有值
- 沒有 error

### 檢查 3: 測試更新操作

在瀏覽器 Console 執行：

```javascript
// 嘗試更新暱稱
const { data: user } = await supabase.auth.getUser();
const { data, error } = await supabase
  .from('profiles')
  .update({ nickname: '測試123' })
  .eq('id', user.user.id)
  .select();

console.log('Update result:', data);
console.log('Update error:', error);
```

**預期結果**：
- 應該成功返回更新後的記錄
- 沒有 error

---

## 🚨 常見錯誤

### 錯誤 1: "relation \"profiles\" does not exist"

**原因**：profiles 表不存在

**解決**：執行步驟 1 的 SQL，創建 profiles 表

### 錯誤 2: "permission denied for table profiles"

**原因**：缺少 RLS 政策

**解決**：執行步驟 2 的 SQL，設定 RLS 政策

### 錯誤 3: "column \"nickname\" does not exist"

**原因**：profiles 表缺少 nickname 欄位

**解決**：執行步驟 1 的 ALTER TABLE 語句

### 錯誤 4: 更新成功但刷新後消失

**原因**：
1. 瀏覽器緩存問題
2. 前端沒有正確重新載入數據

**解決**：
1. 清除瀏覽器緩存（Ctrl + Shift + Delete）
2. 強制重新整理（Ctrl + F5）
3. 檢查瀏覽器 Console 是否有 JavaScript 錯誤

---

## 📝 完整設定 SQL

如果你想一次執行所有設定，複製以下完整 SQL：

```sql
-- ====================================
-- 完整 Profiles 表設定
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
```

---

**執行上述 SQL 後，暱稱保存功能應該就能正常運作了！** ✅
