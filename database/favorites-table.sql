-- ============================================================
-- Favorites 表（收藏的經典對話）
-- ============================================================

CREATE TABLE IF NOT EXISTS favorites (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('text', 'audio')),
    content text NOT NULL,
    audio_url text,
    created_at timestamp with time zone DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_created_at_idx ON favorites(created_at DESC);
CREATE INDEX IF NOT EXISTS favorites_type_idx ON favorites(type);

-- RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 刪除舊政策
DROP POLICY IF EXISTS "用戶可以查看自己的收藏" ON favorites;
DROP POLICY IF EXISTS "用戶可以新增收藏" ON favorites;
DROP POLICY IF EXISTS "用戶可以刪除自己的收藏" ON favorites;

-- 創建新政策
CREATE POLICY "用戶可以查看自己的收藏" ON favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用戶可以新增收藏" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用戶可以刪除自己的收藏" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 驗證
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '======================================';
    RAISE NOTICE '✅ Favorites 表創建完成！';
    RAISE NOTICE '======================================';
    RAISE NOTICE '';
END $$;
