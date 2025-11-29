# 🚀 快速修復：頭像上傳 Bucket not found

## ⚡ 5 分鐘快速設定

### 步驟 1: 登入 Supabase Dashboard

直接點擊這個連結：
```
https://supabase.com/dashboard/project/tqummhyhohacbkmpsgae/storage/buckets
```

### 步驟 2: 創建 Bucket

1. 點擊右上角綠色按鈕 **"New bucket"**

2. 填寫表單：
   ```
   Name: avatars
   Public bucket: ✅ 勾選這個！
   File size limit: 5242880
   Allowed MIME types: image/*
   ```

3. 點擊 **"Create bucket"**

### 步驟 3: 設定存取權限

創建完 bucket 後，點擊 **"Policies"** 標籤

#### 方法 A: 使用模板（推薦，最快）

1. 點擊 **"New Policy"**
2. 選擇模板：**"Allow public read access"**
3. 點擊 **"Review"** → **"Save policy"**

4. 再次點擊 **"New Policy"**
5. 選擇模板：**"Allow authenticated uploads"**
6. 點擊 **"Review"** → **"Save policy"**

#### 方法 B: 使用 SQL（精確控制）

前往：https://supabase.com/dashboard/project/tqummhyhohacbkmpsgae/sql/new

複製貼上以下 SQL，然後點擊 **"Run"**：

```sql
-- 1. 允許所有人讀取頭像
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 2. 允許已登入用戶上傳頭像
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 3. 允許用戶更新自己的頭像
CREATE POLICY "User Update Own Avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 4. 允許用戶刪除自己的頭像
CREATE POLICY "User Delete Own Avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');
```

### 步驟 4: 驗證設定

回到你的應用：
```
https://megan.tonetown.ai/dashboard/profile
```

嘗試上傳頭像 → 應該成功！✅

---

## 🎯 預期結果

設定完成後：

1. ✅ 可以選擇圖片
2. ✅ 自動壓縮（如果 > 5MB）
3. ✅ 成功上傳到 Supabase
4. ✅ 顯示頭像預覽
5. ✅ 保存到個人資料

---

## 🔍 確認設定是否成功

在 Supabase Dashboard 檢查：

1. **Storage > Buckets**
   - 應該看到 `avatars` bucket
   - 狀態顯示為 **Public**

2. **Storage > Policies**
   - 至少有 2 個政策：
     - ✅ SELECT (讀取)
     - ✅ INSERT (上傳)

3. **上傳測試**
   - 嘗試上傳任何圖片
   - 如果成功，會在 Storage 中看到檔案
   - 檔案名稱格式：`{user_id}-{timestamp}.jpg`

---

## ❌ 如果還是失敗

### 檢查清單：

- [ ] Bucket 名稱是 `avatars`（小寫，沒有空格）
- [ ] Public bucket 有勾選
- [ ] 至少有 SELECT 和 INSERT 兩個政策
- [ ] 已經重新整理瀏覽器頁面
- [ ] 已經重新登入應用

### 查看錯誤詳情

打開瀏覽器開發者工具（F12）→ Console 標籤

如果看到其他錯誤訊息，告訴我具體的錯誤內容。

---

**現在就去設定吧！** 🚀

只需要 5 分鐘！
