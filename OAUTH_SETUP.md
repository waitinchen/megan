# 🔐 Google OAuth 設定完整指南 - 解決 "invalid_client" 錯誤

## ❌ 當前錯誤

```
發生錯誤 401： invalid_client
The OAuth client was not found.
```

這個錯誤表示 **Supabase 中沒有正確配置 Google OAuth**。

---

## ✅ 解決步驟

### 步驟 1: 在 Google Cloud Console 建立 OAuth 2.0 憑證

1. **前往 Google Cloud Console**
   - 訪問：https://console.cloud.google.com/
   - 選擇或建立一個專案

2. **啟用 Google+ API**
   - 左側選單 → **API 和服務** → **程式庫**
   - 搜尋 "Google+ API" 並啟用

3. **建立 OAuth 2.0 憑證**
   - 左側選單 → **API 和服務** → **憑證**
   - 點擊 **建立憑證** → **OAuth 用戶端 ID**
   - 應用程式類型：**網頁應用程式**
   - 名稱：`Megan Login`
   - **已授權的 JavaScript 來源**：
     ```
     http://localhost:3000
     https://megan.tonetown.ai
     ```
   - **已授權的重新導向 URI**（非常重要！）：
     ```
     https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
     ```
   - 點擊 **建立**

4. **複製憑證資訊**
   - 複製 **用戶端 ID** (Client ID)
   - 複製 **用戶端密鑰** (Client Secret)
   - **請妥善保管這些資訊！**

---

### 步驟 2: 在 Supabase 中設定 Google OAuth

1. **前往 Supabase Dashboard**
   - 訪問：https://supabase.com/dashboard
   - 選擇你的專案

2. **進入 Authentication 設定**
   - 左側選單 → **Authentication**
   - 點擊 **Providers** 標籤
   - 找到 **Google** 並點擊

3. **啟用並設定 Google Provider**
   - ✅ 勾選 **Enable Google provider**
   - **Client ID (for OAuth)**: 貼上從 Google Cloud Console 複製的 Client ID
   - **Client Secret (for OAuth)**: 貼上從 Google Cloud Console 複製的 Client Secret
   - **Authorized Client IDs**: 留空（或填入你的 Client ID）
   - 點擊 **Save**

4. **確認 Redirect URL**
   - 在 Supabase 的 Google provider 設定頁面，會顯示：
   ```
   Redirect URL: https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
   ```
   - 確認這個 URL 已經加入到 Google Cloud Console 的「已授權的重新導向 URI」中

---

### 步驟 3: 驗證設定

#### 3.1 檢查 Google Cloud Console 的 Redirect URI

✅ 確認已加入：
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

#### 3.2 檢查 Supabase 設定

✅ 確認已啟用 Google provider
✅ 確認 Client ID 和 Client Secret 已正確填入

#### 3.3 測試登入

1. 訪問 `http://localhost:3000/login`
2. 點擊「使用 Google 登入」
3. 應該會跳轉到 Google 登入頁面
4. 登入成功後應自動返回應用

---

## 🔍 專案現況檢查清單

### ✅ 已完成的項目

- [x] Supabase 依賴套件已安裝
- [x] `/login` 頁面已建立
- [x] `/auth/callback` 路由已建立
- [x] `/welcome` 頁面已建立
- [x] `profiles` 資料表已建立
- [x] 登入頁面可以正常顯示

### ⚠️ 需要完成的項目

- [ ] **Google OAuth 在 Supabase 中啟用並設定**
  - [ ] 已在 Google Cloud Console 建立 OAuth 2.0 憑證
  - [ ] 已在 Supabase 中填入 Client ID 和 Client Secret
  - [ ] 已在 Google Cloud Console 加入 Redirect URI

- [ ] 環境變數設定（`.env.local`）
  - [ ] `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `NEXT_PUBLIC_SITE_URL`

---

## 🎯 快速設定流程圖

```
1. Google Cloud Console
   └─> 建立 OAuth 2.0 憑證
       ├─> 複製 Client ID
       └─> 複製 Client Secret

2. Google Cloud Console - Redirect URI
   └─> 加入：https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback

3. Supabase Dashboard
   └─> Authentication → Providers → Google
       ├─> 啟用 Google provider
       ├─> 填入 Client ID
       └─> 填入 Client Secret

4. 測試登入
   └─> http://localhost:3000/login
```

---

## 🐛 常見問題

### Q: 仍然出現 "invalid_client" 錯誤？

**A: 檢查以下項目：**

1. ✅ Client ID 和 Client Secret 是否正確複製（沒有多餘空格）
2. ✅ 是否在 Supabase 中「啟用」了 Google provider（不只填入資料）
3. ✅ Redirect URI 是否完全一致（包含 `https://` 結尾沒有斜線）
4. ✅ Google Cloud Console 中 OAuth 憑證是否已建立

### Q: 登入後沒有跳轉？

**A: 檢查 Callback URL：**

- 確認 `/auth/callback` 路由正確
- 確認 Supabase 中的 Redirect URI 設定正確

### Q: 如何找到 Supabase 的 Redirect URL？

**A:** 在 Supabase Dashboard → Authentication → Providers → Google 頁面中，會顯示正確的 Redirect URL。

---

## 📝 重要提醒

1. **Redirect URI 必須完全一致**
   - Google Cloud Console 和 Supabase 中看到的必須相同
   - 通常是：`https://你的專案.supabase.co/auth/v1/callback`

2. **環境變數**
   - 必須在 `.env.local` 中設定 Supabase URL 和 Anon Key
   - 修改後需要重啟開發伺服器

3. **測試環境**
   - 本地開發：使用 `http://localhost:3000`
   - 生產環境：使用實際域名

---

完成以上設定後，"invalid_client" 錯誤應該就會解決了！🎉


