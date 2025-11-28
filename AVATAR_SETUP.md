# 頭像功能設置指南

## 🎯 需要完成的步驟

### 1. 添加 `avatar_url` 欄位到 profiles 表

前往 **Supabase Dashboard > SQL Editor** 並執行：

```sql
-- 添加 avatar_url 欄位
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 驗證欄位已添加
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'avatar_url';
```

### 2. 創建 Storage Bucket

前往 **Supabase Dashboard > Storage**：

1. 點擊 **"New bucket"**
2. 設置如下：
   - **Name**: `avatars`
   - **Public bucket**: ✅ **啟用** (重要！)
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: 留空（允許所有圖片格式）

3. 點擊 **"Create bucket"**

### 3. 設置 RLS 政策

在創建 bucket 後，需要設置 Row Level Security 政策：

#### 政策 1: 允許所有人讀取頭像
```sql
-- 在 Storage > avatars bucket > Policies 添加
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
```

#### 政策 2: 允許用戶上傳/更新自己的頭像
```sql
-- 允許認證用戶上傳
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 允許用戶更新自己的頭像
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars');

-- 允許用戶刪除自己的頭像
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

### 4. 驗證設置

完成後，檢查：

- ✅ `profiles.avatar_url` 欄位存在
- ✅ `avatars` bucket 已創建且為 Public
- ✅ RLS 政策已設置

### 5. 測試上傳

在應用程式中：

1. 登入用戶帳號
2. 前往 **Dashboard > Profile**
3. 點擊 **"選擇圖片"** 按鈕
4. 選擇一張圖片（< 5MB）
5. 上傳成功後應顯示 "頭像上傳成功！✨"

---

## 🔧 如果遇到問題

### 問題 1: "新 row 違反 row-level security 政策"

**原因**: RLS 政策未正確設置

**解決**: 確保已執行上方所有 RLS 政策 SQL

### 問題 2: "Bucket not found"

**原因**: avatars bucket 不存在

**解決**: 在 Storage 創建 `avatars` bucket

### 問題 3: 上傳後看不到圖片

**原因**: Bucket 未設為 Public

**解決**: Storage > avatars > Settings > Public bucket 設為啟用

---

## 📋 完整設置檢查清單

- [ ] 執行 SQL: 添加 `avatar_url` 欄位
- [ ] 創建 Storage bucket: `avatars` (Public)
- [ ] 設置 RLS 政策: Public Access (SELECT)
- [ ] 設置 RLS 政策: Upload (INSERT)
- [ ] 設置 RLS 政策: Update (UPDATE)
- [ ] 設置 RLS 政策: Delete (DELETE)
- [ ] 測試上傳功能

---

**設置完成後，頭像功能即可正常使用！** 🎉
