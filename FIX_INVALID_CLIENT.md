# 🔧 修復 "invalid_client" 錯誤 - 完整指南

## 🎯 問題分析

"invalid_client" 錯誤（401）表示 Google 無法識別 OAuth 客戶端。這通常是由以下原因造成的：

1. **Supabase 中的 Client ID 與 Google Cloud Console 不匹配**
2. **Supabase 中的 Client Secret 不正確**
3. **設定未正確儲存**

---

## ✅ 立即檢查清單

### 檢查 1: Supabase Client ID 設定

**位置**：Supabase Dashboard → Authentication → Providers → Google

**必須確認**：
- [ ] Client IDs 欄位應該**只包含** Client ID，格式如下：
  ```
  817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
  ```
  
**常見錯誤**：
- ❌ 包含多個 Client ID（用逗號分隔）
- ❌ 包含多餘空格
- ❌ 缺少 `.apps.googleusercontent.com` 後綴
- ❌ 複製時遺漏部分字元

**正確做法**：
1. 清空 Client IDs 欄位
2. 從 Google Cloud Console 複製完整的 Client ID
3. 直接貼上（不要手動輸入）
4. **檢查每個字元是否正確**
5. 點擊 **Save**

---

### 檢查 2: Supabase Client Secret 設定

**位置**：Supabase Dashboard → Authentication → Providers → Google

**必須確認**：
- [ ] Client Secret (for OAuth) 欄位應該包含：
  ```
  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
  ```

**如果顯示為 `••••••••`**：
1. 點擊眼睛圖示查看實際值
2. 如果與 Google Cloud Console 中的不同：
   - 清空欄位
   - 從 Google Cloud Console 複製 Client Secret
   - 貼上
   - 點擊 **Save**

**重要提醒**：
- Client Secret 是區分大小寫的
- 必須包含所有連字號 `-` 和底線 `_`
- 不要有多餘空格

---

### 檢查 3: Google Cloud Console 設定

**位置**：Google Cloud Console → APIs & Services → Credentials

**必須確認**：

1. **OAuth 2.0 Client ID 狀態**：
   - [ ] 狀態應該是「已啟用」
   - [ ] 應用程式類型應該是「網頁應用程式」

2. **已授權的重新導向 URI** 必須包含：
   ```
   https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
   ```
   - [ ] URL 完全正確（沒有拼寫錯誤）
   - [ ] 沒有多餘的空格
   - [ ] 結尾沒有斜線 `/`

3. **已授權的 JavaScript 來源**：
   - [ ] 包含 `http://localhost:3000`（不是 30000）
   - [ ] 包含 `https://megan.tonetown.ai`

---

## 🔄 完整重置步驟（推薦）

如果以上檢查都正確但仍出現錯誤，請按照以下步驟**完全重置**：

### 步驟 1: 清除 Supabase 設定

1. 前往 Supabase Dashboard → Authentication → Providers → Google
2. **取消勾選**「Enable Sign in with Google」
3. **清空** Client IDs 欄位
4. **清空** Client Secret 欄位
5. 點擊 **Save**

### 步驟 2: 重新設定 Supabase

1. **重新勾選**「Enable Sign in with Google」
2. **複製 Client ID**（從 Google Cloud Console）：
   ```
   817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
   ```
3. **貼到** Supabase 的 Client IDs 欄位
4. **複製 Client Secret**（從 Google Cloud Console）：
   ```
   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
   ```
5. **貼到** Supabase 的 Client Secret 欄位
6. **檢查** Callback URL 是否顯示：
   ```
   https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
   ```
7. 點擊 **Save**
8. **等待 30 秒**

### 步驟 3: 驗證 Google Cloud Console

1. 前往 Google Cloud Console → APIs & Services → Credentials
2. 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`
3. 確認 Client ID 和 Client Secret 與 Supabase 中的一致
4. 確認 Redirect URI 包含 Supabase callback URL
5. 如果有變更，點擊「儲存」

### 步驟 4: 等待並測試

1. **等待 5-10 分鐘**（讓 Google 的設定生效）
2. **清除瀏覽器快取和 Cookies**
3. 訪問 `http://localhost:3000/login`
4. 點擊「使用 Google 登入」
5. 測試是否成功

---

## 🔍 進階診斷

### 診斷 1: 檢查實際發送的請求

1. 打開瀏覽器開發者工具（F12）
2. 切換到 **Network** 標籤
3. 點擊「使用 Google 登入」
4. 查看跳轉的 Google OAuth URL
5. 在 URL 中找到 `client_id` 參數
6. 確認這個值是否與 Google Cloud Console 中的 Client ID 一致

**預期的 URL 格式**：
```
https://accounts.google.com/o/oauth2/v2/auth?client_id=817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com&...
```

### 診斷 2: 檢查 Supabase 日誌

1. 前往 Supabase Dashboard → Logs → Auth Logs
2. 查看最近的認證嘗試記錄
3. 檢查是否有錯誤訊息

---

## ⚠️ 常見錯誤範例

### 錯誤 1: Client ID 包含多餘內容
```
❌ 錯誤: megan-client:817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
✅ 正確: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
```

### 錯誤 2: Client ID 缺少後綴
```
❌ 錯誤: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27
✅ 正確: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
```

### 錯誤 3: Client Secret 多餘空格
```
❌ 錯誤: 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 
✅ 正確: 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
```

---

## ✅ 最終檢查清單

完成所有設定後，確認以下項目：

- [ ] Supabase 中 Client ID 完全正確（逐字檢查）
- [ ] Supabase 中 Client Secret 完全正確
- [ ] 已點擊 Supabase 的 Save 按鈕
- [ ] Google Cloud Console 中 Redirect URI 正確
- [ ] 已等待 5-10 分鐘讓設定生效
- [ ] 已清除瀏覽器快取
- [ ] 開發伺服器正在運行

---

## 🆘 如果仍然失敗

如果完成以上所有步驟後仍然出現錯誤，請提供：

1. **Supabase Google Provider 設定頁面的截圖**（遮罩敏感資訊）
2. **瀏覽器 Console 的完整錯誤訊息**（F12 → Console）
3. **Network 標籤中 OAuth 請求的 URL**（F12 → Network）

這樣可以進一步診斷問題。







