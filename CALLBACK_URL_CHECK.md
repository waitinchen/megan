# 🔗 Callback URL 設定確認指南

## ✅ Supabase Callback URL

```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

---

## 📋 必須確認的設定

### 1. Supabase Dashboard 設定

**位置**：Supabase Dashboard → Authentication → Providers → Google

**確認項目**：
- [ ] ✅ **Callback URL (for OAuth)** 應該顯示：
  ```
  https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
  ```
  （這個由 Supabase 自動生成，通常無法修改）

### 2. Google Cloud Console 設定（重要）

**位置**：Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID

**必須確認**：在 **「已授權的重新導向 URI」** 中應該包含：

```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

---

## 🔍 Google Cloud Console 檢查步驟

### 步驟 1: 進入 OAuth 設定

1. 前往 Google Cloud Console
2. APIs & Services → Credentials
3. 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`

### 步驟 2: 檢查 Redirect URIs

在 **「已授權的重新導向 URI」** 區域，應該包含以下 URI：

```
✅ https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
✅ https://megan.tonetown.ai/auth/callback
✅ http://localhost:3000/auth/callback
```

### 步驟 3: 如果缺少，請加入

1. 如果 **沒有** `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
2. 點擊 **"+ 新增 URI"** 按鈕
3. 貼上完整的 URL：
   ```
   https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
   ```
4. 確保：
   - ✅ 包含 `https://`
   - ✅ 沒有多餘的空格
   - ✅ 結尾沒有斜線 `/`
5. 點擊 **「儲存」**

---

## ⚠️ 常見錯誤

### ❌ 錯誤 1: URL 不完整
```
tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```
缺少 `https://`

### ❌ 錯誤 2: 多餘的斜線
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback/
```
結尾不應該有 `/`

### ❌ 錯誤 3: 拼寫錯誤
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callbak
```
`callback` 拼寫錯誤

### ✅ 正確格式
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

---

## 📝 完整設定檢查清單

### Supabase Dashboard
- [ ] Enable Sign in with Google: **ON**
- [ ] Client IDs: `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
- [ ] Client Secret: `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`
- [ ] Callback URL: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback` ✅

### Google Cloud Console
- [ ] Client ID: `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
- [ ] Client Secret: `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`
- [ ] **已授權的重新導向 URI 包含**:
  - [ ] `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback` ✅
  - [ ] `https://megan.tonetown.ai/auth/callback`
  - [ ] `http://localhost:3000/auth/callback`

---

## 🎯 OAuth 流程中的 Callback URL

### 正常流程：

1. **用戶點擊登入** → 跳轉到 Google OAuth 頁面
2. **Google 驗證成功** → Google 會將用戶導向到 **Supabase Callback URL**:
   ```
   https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback?code=xxx
   ```
3. **Supabase 處理** → Supabase 接收 code，交換成 session
4. **Supabase 重定向** → 根據我們設定的 `redirectTo`，導向到：
   ```
   http://localhost:3000/auth/callback
   ```
5. **Next.js 處理** → 我們的 `/auth/callback` 路由處理 session
6. **最終導向** → 導向到 `/welcome` 頁面

---

## ✅ 確認所有設定

### 目前已知的正確設定值：

```
✅ Client ID: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
✅ Client Secret: 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
✅ Callback URL: https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

### 需要確認的項目：

1. **Supabase 中的 Client Secret 是否已更新為新值**
2. **Google Cloud Console 中的 Redirect URI 是否包含 Supabase callback URL**
3. **所有設定是否已儲存**

---

## 🚀 下一步

1. **確認 Google Cloud Console** 中的 Redirect URI 包含 Supabase callback URL
2. **等待 5-10 分鐘** 讓設定生效
3. **清除瀏覽器快取** 後測試登入

---

**重要**：如果 Google Cloud Console 中沒有 Supabase 的 callback URL，OAuth 流程會失敗。請務必確認已加入！


