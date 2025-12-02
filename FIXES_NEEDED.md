# 🔧 需要立即修正的問題

## 🎯 問題 1: redirectTo 設定錯誤（已修正）

### 原問題
在 `app/login/page.tsx` 中，`redirectTo` 設定為 `/welcome`，但這是錯誤的。

### 正確的流程
1. 用戶點擊「使用 Google 登入」
2. 跳轉到 Google OAuth 頁面
3. Google 驗證後，跳轉到 Supabase callback: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
4. Supabase 處理後，根據 `redirectTo` 跳轉回應用
5. **必須跳轉到 `/auth/callback`**，這樣才會帶上 `code` 參數
6. `/auth/callback` 路由處理 code，交換 session
7. 然後導向到 `/welcome`

### ✅ 已修正
```tsx
redirectTo: `${window.location.origin}/auth/callback`,
```

---

## ⚠️ 問題 2: Google Cloud Console 端口錯誤

### 發現的問題
在 Google Cloud Console 的 OAuth 設定中：
- ❌ `http://localhost:30000` (錯誤的端口)
- ✅ 應該是 `http://localhost:3000`

### 修正步驟
1. 前往 Google Cloud Console
2. APIs & Services → Credentials
3. 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`
4. 在「已授權的 JavaScript 來源」中：
   - 找到 `http://localhost:30000`
   - 編輯為 `http://localhost:3000`
   - 儲存

---

## ❓ 問題 3: Supabase 設定需要確認

### 必須確認的項目

在 Supabase Dashboard → Authentication → Providers → Google 中：

1. ✅ **已啟用 Google provider** (必須勾選)
2. ✅ **Client ID 已填入**:
   ```
   817238464028-qot5sc882lqp90f8fq5fhk85bni11q27.apps.googleusercontent.com
   ```
3. ❓ **Client Secret 已填入** (需要確認)

### 如何檢查

如果 Client Secret 顯示為 `****` 或空，表示：
- 可能沒有填入
- 或者已經填入但無法查看（這是正常的，因為安全考量）

**如果未填入**，需要：
1. 前往 Google Cloud Console
2. 找到 OAuth 2.0 Client ID
3. 查看或重新建立 Client Secret
4. 複製並貼到 Supabase 中

---

## 🔍 檢查清單

完成所有修正後，檢查以下項目：

### Google Cloud Console
- [ ] Client ID: `817238464028-qot5sc882lqp90f8fq5fhk85bni11q27.apps.googleusercontent.com` ✅
- [ ] JavaScript 來源: `http://localhost:3000` (修正端口)
- [ ] Redirect URI: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback` ✅
- [ ] Redirect URI: `https://megan.tonetown.ai/auth/callback` ✅
- [ ] Redirect URI: `http://localhost:3000/auth/callback` ✅

### Supabase Dashboard
- [ ] Google Provider 已啟用 ✅
- [ ] Client ID 已填入 ✅
- [ ] Client Secret 已填入 ❓

### 程式碼
- [ ] `redirectTo` 指向 `/auth/callback` ✅ (已修正)
- [ ] `/auth/callback` 路由正確處理 code ✅

### 環境變數
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 已設定
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 已設定

---

## 🚀 測試步驟

修正完成後：

1. 清除瀏覽器快取和 cookies
2. 訪問 `http://localhost:3000/login`
3. 點擊「使用 Google 登入」
4. 應該會跳轉到 Google 登入頁面
5. 登入後應該自動返回並導向 `/welcome`

---

## 📝 重要提醒

1. **redirectTo 修正後，需要重新啟動開發伺服器**
2. **Google Cloud Console 的變更需要幾分鐘才會生效**
3. **如果仍有錯誤，檢查瀏覽器 Console 的詳細錯誤訊息**







