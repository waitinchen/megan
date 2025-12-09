-- 創建訪客 Profile（修正版 - 包含 auth.users）
-- 這個 profile 用於訪客登入功能
-- 訪客 ID: 00000000-0000-0000-0000-000000000001

-- 檢查是否已存在
DO $$
BEGIN
  -- 1. 先在 auth.users 表中創建訪客用戶（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'
  ) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'guest@megan.internal',
      '',  -- 空密碼（訪客不使用 Supabase 認證）
      NOW(),
      NOW(),
      NOW(),
      '',
      ''
    );
    
    RAISE NOTICE '訪客 auth.users 記錄已創建';
  ELSE
    RAISE NOTICE '訪客 auth.users 記錄已存在';
  END IF;

  -- 2. 在 profiles 表中創建訪客 profile（如果不存在）
  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = '00000000-0000-0000-0000-000000000001'
  ) THEN
    INSERT INTO profiles (
      id,
      nickname,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000001',
      '訪客',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '訪客 Profile 已創建';
  ELSE
    RAISE NOTICE '訪客 Profile 已存在';
  END IF;
END $$;

-- 驗證創建結果
SELECT 
  u.id,
  u.email,
  p.nickname,
  p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.id = '00000000-0000-0000-0000-000000000001';
