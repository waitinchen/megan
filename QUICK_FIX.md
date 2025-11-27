# 🚀 快速修復 "Cannot GET /login" 錯誤

## 問題原因

Next.js 構建時需要 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 環境變數，如果缺失會導致 `/login` 路由無法編譯。

## 立即解決方法

### 1. 檢查 `.env.local` 檔案

確認檔案包含以下兩行（值必須是實際的 Supabase 憑證）：

```env
NEXT_PUBLIC_SUPABASE_URL=https://tqummhyhohacbkmpsgae.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的實際_anon_key
```

### 2. 取得 Supabase Anon Key

如果還沒有 anon key：
1. 訪問 https://supabase.com/dashboard
2. 選擇你的專案
3. Settings → API
4. 複製 "anon public" key

### 3. 清除緩存並重啟

```powershell
# 停止開發伺服器 (Ctrl+C)

# 清除 Next.js 緩存
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 重新啟動
npm run dev
```

### 4. 測試

訪問 `http://localhost:3000/login` - 應該可以正常顯示了！

---

如果還有問題，請檢查：
- ✅ `.env.local` 檔案在項目根目錄
- ✅ 環境變數名稱正確（包含 `NEXT_PUBLIC_` 前綴）
- ✅ 值沒有多餘的空格或引號
- ✅ 已重啟開發伺服器

