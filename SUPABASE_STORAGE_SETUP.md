# 🗄️ Supabase Storage 設定指南

## 問題：上傳頭像失敗 - Bucket not found

### 錯誤原因
Supabase Storage 中缺少 `avatars` bucket，導致頭像上傳失敗。

---

## 📋 解決步驟

### 1. 登入 Supabase Dashboard
前往：https://supabase.com/dashboard/project/YOUR_PROJECT_ID/storage/buckets

### 2. 創建 Avatars Bucket

點擊 **"New bucket"** 按鈕，填寫以下資訊：

```
Name: avatars
Public bucket: ✅ 啟用（勾選）
File size limit: 5242880 (5MB)
Allowed MIME types: image/jpeg,image/png,image/webp,image/gif
```

### 3. 設定 RLS (Row Level Security) 政策

創建 bucket 後，需要設定存取權限政策。

#### 3.1 允許所有人讀取（Public Read）

```sql
-- Policy name: Public read access
-- Operation: SELECT

CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

#### 3.2 允許已登入用戶上傳（Authenticated Upload）

```sql
-- Policy name: Authenticated users can upload
-- Operation: INSERT

CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
);
```

#### 3.3 允許用戶更新自己的頭像（Authenticated Update）

```sql
-- Policy name: Users can update their own avatars
-- Operation: UPDATE

CREATE POLICY "Users can update their own avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

#### 3.4 允許用戶刪除自己的頭像（Authenticated Delete）

```sql
-- Policy name: Users can delete their own avatars
-- Operation: DELETE

CREATE POLICY "Users can delete their own avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

---

## 🎯 在 Dashboard 中設定 RLS 政策

### 方法 1: 使用 SQL Editor

1. 前往：**SQL Editor**
2. 複製貼上上面的 4 個 SQL 語句
3. 依序執行每一個政策

### 方法 2: 使用 Storage Policies UI

1. 前往：**Storage > Policies**
2. 選擇 `avatars` bucket
3. 點擊 **"New Policy"**
4. 按照上面的規則手動創建每個政策

---

## ✅ 驗證設定

### 測試上傳功能

1. 登入你的應用：https://megan.tonetown.ai/login
2. 前往個人資料頁面：https://megan.tonetown.ai/dashboard/profile
3. 嘗試上傳頭像
4. ✅ 應該能成功上傳且顯示預覽

### 檢查 Storage

前往 Supabase Dashboard > Storage > avatars

你應該能看到：
- 檔案以 `{user_id}-{timestamp}.jpg` 格式命名
- 可以公開訪問（有公開 URL）
- 檔案大小在 5MB 以下

---

## 🔍 常見問題

### Q1: 上傳後看不到圖片？
**A:** 檢查 RLS 政策是否正確設定，特別是 "Public read access"。

### Q2: 上傳時顯示 "Bucket not found"？
**A:** 確認 bucket 名稱是 `avatars`（小寫），且已經創建。

### Q3: 上傳成功但無法更新？
**A:** 檢查 UPDATE 政策，確保包含 `auth.uid()` 驗證。

### Q4: 圖片太大無法上傳？
**A:** 應用已實現自動壓縮功能。如果圖片 > 5MB，會自動壓縮到 4.5MB 以下。

---

## 📊 預期 Bucket 設定

```json
{
  "id": "avatars",
  "name": "avatars",
  "public": true,
  "file_size_limit": 5242880,
  "allowed_mime_types": [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ]
}
```

---

## 🚀 完成後

所有頭像上傳功能應該正常運作：
- ✅ 自動壓縮大於 5MB 的圖片
- ✅ 上傳到 Supabase Storage
- ✅ 更新用戶 profile 的 avatar_url
- ✅ 顯示頭像預覽
- ✅ 支援 JPEG、PNG、WebP、GIF 格式

**設定完成！** 🎉
