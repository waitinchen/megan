-- ============================================================
-- 添加頭像欄位到 profiles 表
-- ============================================================

-- 添加 avatar_url 欄位
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- 創建 avatars storage bucket (需要在 Supabase Dashboard 手動執行或使用 Supabase CLI)
-- 注意：這個 SQL 只是參考，實際需要在 Supabase Dashboard > Storage 創建 bucket

/*
  手動創建步驟：
  1. 前往 Supabase Dashboard
  2. 點擊 Storage
  3. 創建新 bucket，命名為 'avatars'
  4. 設置為 Public bucket
  5. 設置 RLS 政策：
     - 允許用戶上傳自己的頭像
     - 允許所有人讀取頭像
*/

-- 驗證欄位
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
AND column_name = 'avatar_url';
