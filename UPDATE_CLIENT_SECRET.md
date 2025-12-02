# 🔄 更新 Client Secret - 步驟指南

## 🔑 新的憑證資訊

```
Client ID: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
Client Secret: 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 (新的)
```

---

## ✅ 更新步驟

### 步驟 1: 更新 Supabase 設定

1. **前往 Supabase Dashboard**:
   - 登入 https://supabase.com/dashboard
   - 選擇你的專案 `megan`
   - 左側選單 → **Authentication**
   - 點擊 **Providers** 標籤（或 "Sign In / Providers"）
   - 找到 **Google** 並點擊

2. **更新 Client Secret**:
   - 找到 **"Client Secret (for OAuth)"** 欄位
   - **清空**現有的值（如果有）
   - **貼上新的 Client Secret**:
     ```
     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
     ```
   - ⚠️ **檢查**：
     - 沒有多餘的空格
     - 完全複製整個字串
     - 包含所有連字號

3. **確認 Client ID**:
   - 檢查 **"Client IDs"** 欄位應該是：
     ```
     817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
     ```
   - 如果不正確，請更新

4. **確認其他設定**:
   - ✅ **Enable Sign in with Google**: 應該是 **ON**（已啟用）
   - ✅ **Callback URL**: 應該顯示：
     ```
     https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
     ```

5. **儲存**:
   - 點擊頁面底部的 **"Save"** 按鈕
   - 等待幾秒鐘確認儲存成功

---

### 步驟 2: 確認 Google Cloud Console

1. **前往 Google Cloud Console**:
   - https://console.cloud.google.com/
   - APIs & Services → Credentials
   - 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`

2. **確認 Client Secret**:
   - 應該能看到新的 Client Secret: `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`
   - 如果看不到，可能需要點擊「顯示」按鈕

3. **確認 Redirect URI**:
   - 確認「已授權的重新導向 URI」包含：
     ```
     https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
     ```

---

### 步驟 3: 等待並測試

1. **等待 5-10 分鐘**:
   - Google 的 OAuth 設定變更需要時間生效
   - 建議等待 5-10 分鐘

2. **清除瀏覽器快取**:
   - 按 `Ctrl + Shift + Delete` 清除快取和 Cookies
   - 或使用無痕模式測試

3. **測試登入**:
   - 訪問 `http://localhost:3000/login`
   - 點擊「使用 Google 登入」
   - 應該能正常跳轉到 Google 登入頁面

---

## 🔍 完整設定確認清單

### Supabase Dashboard
- [ ] Enable Sign in with Google: **ON** ✅
- [ ] Client IDs: `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com` ✅
- [ ] Client Secret: `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` ✅ (新的)
- [ ] Callback URL: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback` ✅
- [ ] 已點擊 **Save** 按鈕 ✅

### Google Cloud Console
- [ ] Client ID: `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com` ✅
- [ ] Client Secret: `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` ✅ (新的)
- [ ] Redirect URI 包含 Supabase callback URL ✅

---

## ⚠️ 重要提醒

1. **舊的 Client Secret 已失效**:
   - 如果你重置了 Client Secret，舊的 Secret (`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`) 已失效
   - **必須**使用新的 Secret (`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`)

2. **設定需要時間生效**:
   - 更新後，建議等待 5-10 分鐘
   - 不要立即測試，可能會出現緩存問題

3. **複製時要小心**:
   - Client Secret 是區分大小寫的
   - 不要多餘空格
   - 完整複製整個字串

---

## 🐛 如果仍有錯誤

如果更新後仍然出現 "invalid_client" 錯誤：

1. **檢查 Supabase 設定**:
   - 確認 Client Secret 已正確貼上
   - 確認已點擊 Save
   - 嘗試重新整理頁面後再次檢查

2. **檢查瀏覽器 Console**:
   - 按 F12 打開開發者工具
   - 查看 Console 標籤的錯誤訊息
   - 查看 Network 標籤的請求

3. **等待更長時間**:
   - 有時需要等待 15-20 分鐘讓 Google 的設定完全生效

---

## ✅ 成功標誌

當設定正確時：
- ✅ 點擊「使用 Google 登入」後，應該跳轉到 Google 登入頁面
- ✅ 不會出現 "invalid_client" 錯誤
- ✅ 登入成功後會自動返回應用

---

**下一步**：請在 Supabase Dashboard 中更新 Client Secret，然後等待 5-10 分鐘再測試。







