# ✅ Google OAuth 設定確認清單

## 🔑 Google OAuth 憑證資訊

```
Client ID: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
Client Secret: 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
```

---

## 📋 Supabase 設定檢查清單

### ✅ 步驟 1: 確認 Supabase Dashboard 設定

在 **Supabase Dashboard → Authentication → Providers → Google** 中：

#### 1.1 基本設定
- [ ] ✅ **Enable Sign in with Google**: 已啟用（ON）
- [ ] ❓ **Client IDs**: 
  ```
  817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
  ```
  **確認**：應該與 Google Cloud Console 中的 Client ID 完全一致

- [ ] ❓ **Client Secret (for OAuth)**:
  ```
  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
  ```
  **確認**：
  - 如果顯示為 `••••••••`（遮罩），點擊眼睛圖示查看
  - 確認值是否正確（應該完全匹配上面提供的值）
  - 如果不匹配或為空，請填入正確的值

- [ ] ✅ **Callback URL**: 
  ```
  https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
  ```
  **確認**：這個值由 Supabase 自動生成，應該顯示在頁面上

#### 1.2 其他設定
- [ ] **Skip nonce checks**: 保持關閉（OFF）
- [ ] **Allow users without an email**: 保持關閉（OFF）

#### 1.3 儲存設定
- [ ] 確認所有值正確後，點擊 **"Save"** 按鈕
- [ ] 等待幾秒鐘讓設定生效

---

## 🔍 Google Cloud Console 設定檢查

### ✅ 步驟 2: 確認 Google Cloud Console 設定

#### 2.1 OAuth 2.0 Client ID 設定

在 **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID** (`megan-oauth-new0`) 中：

- [ ] **Client ID**:
  ```
  817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
  ```
  ✅ 確認正確

- [ ] **Client Secret**: 
  ```
  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
  ```
  ✅ 確認正確（在 Google Cloud Console 中可以查看）

#### 2.2 已授權的 JavaScript 來源

- [ ] ✅ `https://megan.tonetown.ai`
- [ ] ⚠️ `http://localhost:30000` ← **需要修正為** `http://localhost:3000`
- [ ] 確認沒有多餘的空格或錯誤的端口

#### 2.3 已授權的重新導向 URI

- [ ] ✅ `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
- [ ] ✅ `https://megan.tonetown.ai/auth/callback`
- [ ] ✅ `http://localhost:3000/auth/callback`

---

## 🔧 需要立即修正的項目

### ⚠️ 優先級 1: 修正 Google Cloud Console 端口

1. 前往 Google Cloud Console
2. APIs & Services → Credentials
3. 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`
4. 找到「已授權的 JavaScript 來源」
5. 將 `http://localhost:30000` 改為 `http://localhost:3000`
6. 儲存變更

### ⚠️ 優先級 2: 確認 Supabase Client Secret

1. 前往 Supabase Dashboard
2. Authentication → Providers → Google
3. 查看「Client Secret (for OAuth)」
4. 如果值不同或為空：
   - 點擊眼睛圖示查看當前值
   - 如果不是 `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`，請更新
   - 點擊 Save

---

## ✅ 程式碼設定（已確認）

### 登入頁面 (`app/login/page.tsx`)
- [x] ✅ `redirectTo` 已修正為 `/auth/callback`

### Callback 路由 (`app/auth/callback/route.ts`)
- [x] ✅ 正確處理 OAuth code
- [x] ✅ 導向 `/welcome`

---

## 🧪 測試步驟

完成所有設定後：

1. **清除瀏覽器快取和 cookies**
2. **確認開發伺服器運行中** (`npm run dev`)
3. **訪問** `http://localhost:3000/login`
4. **點擊「使用 Google 登入」**
5. **預期結果**：
   - ✅ 跳轉到 Google 登入頁面
   - ✅ 登入成功後返回應用
   - ✅ 自動導向到 `/welcome` 頁面

---

## 🐛 如果仍有錯誤

### 錯誤: "invalid_client"

**可能原因**：
1. Supabase 中的 Client ID 或 Client Secret 與 Google Cloud Console 不匹配
2. Google Cloud Console 中的 Redirect URI 未包含 Supabase callback URL

**檢查**：
1. 確認 Supabase 中的 Client ID 完全一致（沒有多餘空格）
2. 確認 Supabase 中的 Client Secret 完全一致
3. 確認已點擊 Supabase 的 "Save" 按鈕
4. 等待 5-10 分鐘讓 Google 的設定生效

### 錯誤: "redirect_uri_mismatch"

**原因**：Google Cloud Console 中的 Redirect URI 設定不正確

**解決**：確認已加入：
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

---

## 📝 設定摘要

### Google Cloud Console
- ✅ Client ID: `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
- ✅ Client Secret: `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`
- ⚠️ JavaScript 來源需要修正端口

### Supabase Dashboard
- ✅ Provider 已啟用
- ❓ 需要確認 Client ID 和 Client Secret 已正確填入

### 程式碼
- ✅ redirectTo 已修正
- ✅ Callback 路由正確

---

**下一步**：請確認 Supabase 中的 Client Secret 是否正確，然後修正 Google Cloud Console 的端口設定。







