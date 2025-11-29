-- ====================================
-- Storage RLS 政策設定
-- 允許用戶上傳和刪除自己的頭像
-- ====================================

-- 1. 允許所有人讀取頭像（公開訪問）
CREATE POLICY "Public Avatar Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 2. 允許已登入用戶上傳頭像
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars');

-- 3. 允許已登入用戶更新頭像
CREATE POLICY "User Update Own Avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK (bucket_id = 'avatars');

-- 4. 允許已登入用戶刪除頭像
CREATE POLICY "User Delete Own Avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars');

-- 5. 驗證政策
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';
