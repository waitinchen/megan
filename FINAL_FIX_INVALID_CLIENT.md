# 🔧 最終修復 "invalid_client" - 錯誤 401

## ❌ 錯誤詳情

```
錯誤 401：invalid_client
要求詳情： flowName=GeneralOAuthFlow
```

**這表示**：
- ✅ OAuth 流程已正確啟動
- ❌ Google 無法識別客戶端（Client ID 或 Client Secret 錯誤）

---

## 🎯 根本原因診斷

### 最可能的原因（按優先級）：

1. **Supabase 中的 Client ID 不完整或錯誤**
2. **Supabase 中的 Client Secret 與 Google Cloud Console 不匹配**
3. **Google Cloud Console 中的 Redirect URI 設定錯誤**

---

## ✅ 完整重置流程（推薦）

### 步驟 1: 完全清除 Supabase 設定

1. **前往 Supabase Dashboard**:
   - Authentication → Providers → Google

2. **重置設定**:
   - ❌ 取消勾選「Enable Sign in with Google」
   - 清空「Client IDs」欄位
   - 清空「Client Secret (for OAuth)」欄位
   - 點擊 **Save**

3. **等待 5 秒**

---

### 步驟 2: 從 Google Cloud Console 複製憑證

1. **前往 Google Cloud Console**:
   - https://console.cloud.google.com/
   - APIs & Services → Credentials
   - 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`

2. **複製 Client ID**:
   - 找到「用戶端 ID (Client ID)」
   - **完整複製**（包括 `.apps.googleusercontent.com`）
   - 應該是：`817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
   - ⚠️ **確認長度**：應該是 72 個字元

3. **複製 Client Secret**:
   - 找到「用戶端密鑰 (Client secret)」
   - 如果看不到完整值，可能需要「重設密鑰」
   - **完整複製**：`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`
   - ⚠️ **確認格式**：應該以 `GOCSPX-` 開頭

---

### 步驟 3: 重新設定 Supabase

1. **回到 Supabase Dashboard**:
   - Authentication → Providers → Google

2. **重新啟用並設定**:
   - ✅ 勾選「Enable Sign in with Google」

3. **填入 Client IDs**:
   - **清空**欄位
   - **貼上**剛才複製的完整 Client ID
   - ⚠️ **檢查結尾**：確認是 `.apps.googleusercontent.com`（不是 `.apps.googleuserco`）
   - ⚠️ **檢查長度**：應該是 72 個字元

4. **填入 Client Secret**:
   - **清空**欄位
   - **貼上**剛才複製的完整 Client Secret
   - ⚠️ **檢查開頭**：確認是 `GOCSPX-`

5. **確認 Callback URL**:
   - 應該顯示：`https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
   - 如果顯示不完整，重新整理頁面

6. **點擊 Save**：
   - 等待儲存完成
   - 確認沒有錯誤訊息

---

### 步驟 4: 驗證 Google Cloud Console 設定

1. **檢查 Redirect URIs**:
   - 應該包含：
     ```
     https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
     ```

2. **檢查 JavaScript Origins**:
   - 應該包含：
     ```
     http://localhost:3000
     https://megan.tonetown.ai
     ```

3. **如果缺少，請加入並儲存**

---

### 步驟 5: 驗證設定一致性

#### Google Cloud Console 中的值：
```
Client ID: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
Client Secret: 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
```

#### Supabase 中的值必須**完全一致**：
```
Client IDs: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
Client Secret: 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
```

**逐字檢查**，確保：
- ✅ 沒有任何多餘空格
- ✅ 大小寫完全一致
- ✅ 沒有遺漏任何字元
- ✅ 結尾沒有多餘符號

---

### 步驟 6: 等待並測試

1. **等待 5-10 分鐘**：
   - Google 的設定變更需要時間生效

2. **清除瀏覽器**：
   - 清除快取和 Cookies
   - 或使用無痕模式

3. **測試登入**：
   - 訪問 `http://localhost:3000/login`
   - 點擊「使用 Google 登入」
   - 應該能正常跳轉到 Google 登入頁面

---

## 🔍 驗證檢查清單

完成設定後，確認以下項目：

### Supabase Dashboard
- [ ] Enable Sign in with Google: **ON** ✅
- [ ] Client IDs: **完整的 72 個字元** ✅
  - [ ] 結尾是 `.apps.googleusercontent.com` ✅
  - [ ] 與 Google Cloud Console 完全一致 ✅
- [ ] Client Secret: **以 `GOCSPX-` 開頭** ✅
  - [ ] 與 Google Cloud Console 完全一致 ✅
- [ ] Callback URL: **顯示完整** ✅
- [ ] 已點擊 **Save** ✅

### Google Cloud Console
- [ ] Redirect URI 包含 Supabase callback URL ✅
- [ ] JavaScript Origins 包含 `http://localhost:3000` ✅
- [ ] Client ID 與 Supabase 中完全一致 ✅
- [ ] Client Secret 與 Supabase 中完全一致 ✅

---

## 🚨 如果仍然失敗

### 檢查 1: 確認 Client ID 完整性

在 Supabase 的 Client IDs 欄位中：
1. 選取全部文字（Ctrl+A）
2. 複製（Ctrl+C）
3. 貼到文字編輯器（如記事本）
4. 檢查是否完整：
   - 應該以 `.apps.googleusercontent.com` 結尾
   - 總長度應該是 72 個字元

### 檢查 2: 檢查瀏覽器 Console

1. 打開瀏覽器開發者工具（F12）
2. 切換到 **Console** 標籤
3. 點擊「使用 Google 登入」
4. 查看是否有錯誤訊息

### 檢查 3: 檢查 Network 請求

1. 打開瀏覽器開發者工具（F12）
2. 切換到 **Network** 標籤
3. 點擊「使用 Google 登入」
4. 查看跳轉的 Google OAuth URL
5. 在 URL 中找到 `client_id` 參數
6. 確認這個值是否與 Google Cloud Console 中的 Client ID 完全一致

**預期的 URL 格式**：
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com&...
```

---

## 💡 關鍵提醒

1. **Client ID 必須完整**：
   - 如果缺少 `ntent.com` 部分，Google 無法識別
   - 必須是完整的 72 個字元

2. **設定需要時間生效**：
   - 更新後等待 5-10 分鐘
   - 不要立即測試

3. **清除快取很重要**：
   - 瀏覽器可能緩存了錯誤的設定
   - 使用無痕模式或清除 Cookies

---

## 📝 正確的設定值（參考）

```
Google Cloud Console:
├─ Client ID: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
├─ Client Secret: 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
└─ Redirect URI: https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback

Supabase Dashboard:
├─ Client IDs: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
├─ Client Secret: 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
└─ Callback URL: https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

**兩邊的值必須完全一致！**

---

**按照以上步驟完全重置後，錯誤應該會解決。關鍵是確保 Client ID 是完整的 72 個字元。**

