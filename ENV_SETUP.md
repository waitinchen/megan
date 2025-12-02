# 🔧 環境變數設定 - 立即解決 "Cannot GET /login" 錯誤

## ❌ 當前錯誤

```
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
```

這個錯誤導致 `/login` 路由無法編譯，因此會顯示 "Cannot GET /login"。

## ✅ 解決步驟

### 步驟 1: 建立 `.env.local` 檔案

在項目根目錄 (`C:\Users\waiti\Megan_Fox\`) 建立 `.env.local` 檔案。

### 步驟 2: 填入 Supabase 環境變數

打開 `.env.local`，加入以下內容：

```env
# Supabase Configuration (必須設定)
NEXT_PUBLIC_SUPABASE_URL=https://tqummhyhohacbkmpsgae.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_supabase_anon_key_這裡

# Site URL
NEXT_PUBLIC_SITE_URL=https://megan.tonetown.ai

# 其他 API Keys (如果已有)
ELEVENLABS_API_KEY=你的_elevenlabs_api_key
ELEVENLABS_VOICE_ID=WUEPpaWdYrRSq7wyeO9O
GOOGLE_API_KEY=你的_google_api_key
```

### 步驟 3: 取得 Supabase Anon Key

1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇你的專案
3. 點擊 **Settings** (左側選單)
4. 點擊 **API**
5. 複製 **"anon public"** 下的 key
6. 貼到 `.env.local` 的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 位置

### 步驟 4: 重啟開發伺服器

```bash
# 停止當前的開發伺服器 (Ctrl+C)
# 清除緩存
rm -rf .next
# 或在 Windows PowerShell:
Remove-Item -Recurse -Force .next

# 重新啟動
npm run dev
```

## 🔍 驗證環境變數

執行以下命令確認環境變數已載入：

```powershell
# PowerShell
Get-Content .env.local
```

或檢查變數是否被正確讀取（在 Node.js 中）：
```js
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);
```

## ✅ 完成後

完成上述步驟後，訪問 `http://localhost:3000/login` 應該就能正常顯示登入頁面了！

## 🆘 還是有問題？

如果設定環境變數後仍有問題，請確認：

1. ✅ `.env.local` 檔案在項目根目錄
2. ✅ 檔案名稱正確（不是 `.env.local.txt`）
3. ✅ 沒有多餘的空格或引號
4. ✅ 已重啟開發伺服器
5. ✅ 已清除 `.next` 緩存








