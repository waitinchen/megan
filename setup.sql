-- Megan Supabase 設定 SQL
-- 請在 Supabase SQL Editor 中執行此檔案

-- 建立 profiles 資料表
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamp with time zone default now()
);

-- 為 id 欄位建立索引（提升查詢效能）
create index if not exists profiles_id_idx on profiles(id);

-- 為 nickname 欄位建立索引（提升搜尋效能）
create index if not exists profiles_nickname_idx on profiles(nickname);








