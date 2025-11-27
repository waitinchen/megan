# Megan Google OAuth + Supabase 設定指南

## 📋 環境變數設定

請在項目根目錄建立 `.env.local` 檔案，並加入以下環境變數：

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tqummhyhohacbkmpsgae.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key

# Site URL
NEXT_PUBLIC_SITE_URL=https://megan.tonetown.ai

# ElevenLabs Configuration (已有)
ELEVENLABS_API_KEY=你的_elevenlabs_api_key
ELEVENLABS_VOICE_ID=WUEPpaWdYrRSq7wyeO9O

# Google Gemini Configuration (已有)
GOOGLE_API_KEY=你的_google_api_key
```

## 🗄️ Supabase 資料庫設定

⚠️ **重要**：請直接打開項目中的 `setup.sql` 文件，複製**整個文件內容**到 Supabase SQL Editor 中執行。

或者，你也可以直接複製以下 SQL 語句：

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamp with time zone default now()
);

create index if not exists profiles_id_idx on profiles(id);
create index if not exists profiles_nickname_idx on profiles(nickname);
```

**注意**：請只複製 SQL 語句部分，不要複製 Markdown 格式的內容（如 `#`、`##` 等標題符號）。

## 🔐 Google OAuth Callback URL

請在 Google OAuth 設定中使用以下 Callback URL：

```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

Supabase 會自動處理這個 Callback 並將 code 轉換為 session。

## ✅ 完成檢查清單

- [ ] 已安裝 Supabase 依賴套件
- [ ] 已建立 `.env.local` 並填入 Supabase 環境變數
- [ ] 已在 Supabase 建立 `profiles` 資料表
- [ ] 已在 Google OAuth 設定中使用正確的 Callback URL
- [ ] `/login` 頁面可以正常顯示
- [ ] 可以成功進行 Google 登入
- [ ] `/welcome` 頁面可以正常顯示並保存暱稱
- [ ] 主頁可以正確檢查登入狀態並顯示暱稱

## 🔍 測試步驟

1. 訪問 `/login` 頁面
2. 點擊「使用 Google 登入」按鈕
3. 完成 Google 登入後應該自動導向 `/welcome`
4. 在 `/welcome` 輸入暱稱並保存
5. 應該自動導向主頁，並在左上角看到「嗨，{暱稱}」

## 🐛 除錯

如果遇到問題，可以在瀏覽器 console 執行：

```js
const { createClientComponentClient } = require('@supabase/auth-helpers-nextjs');
const supabase = createClientComponentClient();
const { data } = await supabase.auth.getUser();
console.log(data);
```

如果看到 `data.user.id`，表示登入成功。

