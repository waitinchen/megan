# 🔧 Profile 功能修復指南

## 🐛 問題描述

從截圖看到的錯誤：

1. **暱稱保存失敗**：
   - `更新失敗: Could not find the 'updated_at' column of 'profiles' in the schema cache`
   - 原因：profiles 表缺少 `updated_at` 欄位

2. **頭像上傳失敗**：
   - `上傳失敗: Bucket not found`
   - 原因：Supabase Storage 沒有創建 `avatars` bucket

---

## ✅ 解決方案

### 步驟 1: 修復 profiles 表結構

在 **Supabase Dashboard > SQL Editor** 執行：

```sql
-- 1. 添加 updated_at 欄位
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. 添加 avatar_url 欄位
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 3. 添加微信相關欄位
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_unionid text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_openid text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_nickname text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wechat_avatar text;

-- 4. 更新現有記錄的 updated_at
UPDATE profiles
SET updated_at = created_at
WHERE updated_at IS NULL;

-- 5. 創建索引
CREATE INDEX IF NOT EXISTS idx_profiles_wechat_unionid ON profiles(wechat_unionid);
```

或直接執行 `database/fix-profiles-table.sql`

### 步驟 2: 創建 Storage Bucket

在 **Supabase Dashboard > Storage**：

1. 點擊 **"New bucket"**
2. 設置：
   - **Name**: `avatars`
   - **Public bucket**: ✅ **啟用**
   - **File size limit**: `5242880` (5MB)
3. 點擊 **"Create bucket"**

### 步驟 3: 設置 RLS 政策

在 **Storage > avatars bucket > Policies**：

```sql
-- 1. 允許所有人讀取
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 2. 允許認證用戶上傳
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 3. 允許用戶更新自己的頭像
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- 4. 允許用戶刪除自己的頭像
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

---

## 📝 代碼修復

已修復的問題：

1. **移除手動設置 `updated_at`**：
   - 讓資料庫自動處理（使用 DEFAULT now()）
   - 修改位置：`app/dashboard/profile/page.tsx`

2. **簡化 update 語句**：
   ```typescript
   // Before
   .update({ nickname: newNickname.trim(), updated_at: new Date().toISOString() })

   // After
   .update({ nickname: newNickname.trim() })
   ```

---

## 🧪 測試步驟

### 測試暱稱修改：

1. 登入 Dashboard > Profile
2. 修改暱稱（例如：陳小乖 → 小乖）
3. 點擊「保存」
4. 應該顯示：✅ **暱稱更新成功！Megan 會立即使用新暱稱稱呼你 ✨**
5. 返回主頁，Megan 應該會用新暱稱稱呼你

### 測試頭像上傳：

1. Dashboard > Profile > 大頭貼區域
2. 點擊「選擇圖片」
3. 選擇一張圖片（< 5MB）
4. 應該顯示：✅ **頭像上傳成功！✨**
5. 頭像立即顯示在頁面上
6. 刷新頁面，頭像保持不變

---

## 🔍 驗證清單

- [ ] SQL：執行 `fix-profiles-table.sql`
- [ ] Storage：創建 `avatars` bucket (Public)
- [ ] RLS：設置 4 個政策
- [ ] 測試：暱稱修改成功
- [ ] 測試：頭像上傳成功
- [ ] 測試：頁面刷新後數據保持

---

## 📊 表結構確認

執行此 SQL 查看 profiles 表結構：

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
```

**應該包含這些欄位**：
- `id` (uuid)
- `nickname` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp) ← 新增
- `avatar_url` (text) ← 新增
- `wechat_unionid` (text) ← 新增
- `wechat_openid` (text) ← 新增
- `wechat_nickname` (text) ← 新增
- `wechat_avatar` (text) ← 新增

---

**完成這些步驟後，暱稱和頭像功能應該可以正常使用！** 🎉
