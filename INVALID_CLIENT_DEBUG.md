# 🐛 "invalid_client" 錯誤診斷指南

## ❌ 當前錯誤

```
錯誤 401: invalid_client
The OAuth client was not found.
```

這個錯誤表示 Google 無法識別你的 OAuth 客戶端。

---

## 🔍 可能原因檢查清單

### 原因 1: Client ID 不匹配

**檢查**：Supabase 中的 Client ID 必須與 Google Cloud Console 中的**完全一致**

#### Google Cloud Console 中的 Client ID:
```
817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
```

#### 需要確認的項目：

1. **Supabase Dashboard → Authentication → Providers → Google**
   - Client IDs 欄位應該包含：
     ```
     817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
     ```
   - ⚠️ **檢查是否有以下錯誤**：
     - 多餘的空格
     - 缺少或錯誤的字元
     - 複製時遺漏部分字串
     - 大小寫錯誤（雖然通常都是小寫）

2. **完整比較**：
   ```
   Google Cloud: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
   Supabase 中: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
   ```
   必須**逐字完全一致**！

---

### 原因 2: Client Secret 不匹配

#### Google Cloud Console 中的 Client Secret:
```
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
```

#### 需要確認的項目：

1. **Supabase Dashboard → Authentication → Providers → Google**
   - Client Secret (for OAuth) 欄位應該包含：
     ```
     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
     ```
   - ⚠️ **如果顯示為 `••••••••`**：
     - 點擊眼睛圖示查看實際值
     - 確認是否完全匹配
     - 如果不匹配，請更新並儲存

2. **注意**：
   - Client Secret 是區分大小寫的
   - 必須包含所有連字號和底線
   - 不要有多餘的空格

---

### 原因 3: OAuth 應用程式類型不正確

#### 檢查 Google Cloud Console：

1. **APIs & Services → Credentials → OAuth 2.0 Client ID**
2. 點擊 Client ID: `megan-oauth-new0`
3. 確認**應用程式類型**是：**網頁應用程式** (Web application)
   - ❌ 不應該是：桌面應用程式、行動應用程式等

---

### 原因 4: Redirect URI 未正確設定

#### Google Cloud Console 中必須包含：

1. **已授權的重新導向 URI** 必須包含：
   ```
   https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
   ```

2. **檢查項目**：
   - ✅ URL 是否完全正確（沒有拼寫錯誤）
   - ✅ 是否包含 `https://` 前綴
   - ✅ 結尾沒有多餘的斜線 `/`
   - ✅ 沒有多餘的空格

---

### 原因 5: OAuth 同意畫面未完成

#### 檢查項目：

1. **Google Cloud Console → APIs & Services → OAuth consent screen**
2. 確認：
   - ✅ OAuth 同意畫面已配置
   - ✅ 應用程式狀態不是「測試中」限制（或已加入測試用戶）
   - ✅ 已設定必要的範圍（scopes）

---

## 🔧 逐步修正流程

### 步驟 1: 驗證 Client ID

1. **Google Cloud Console**:
   - APIs & Services → Credentials
   - 複製完整的 Client ID（包括 `.apps.googleusercontent.com`）

2. **Supabase Dashboard**:
   - Authentication → Providers → Google
   - 清空 Client IDs 欄位
   - 重新貼上 Client ID
   - **仔細檢查每個字元**
   - 點擊 Save

### 步驟 2: 驗證 Client Secret

1. **Google Cloud Console**:
   - 如果看不到 Client Secret，可能需要重新建立：
     - 點擊 Client ID 進入詳細頁面
     - 在 Client Secret 區域點擊「重設密鑰」
     - 複製新的 Client Secret

2. **Supabase Dashboard**:
   - Authentication → Providers → Google
   - 清空 Client Secret 欄位
   - 貼上新的 Client Secret
   - 點擊 Save

### 步驟 3: 驗證 Redirect URI

1. **Google Cloud Console**:
   - 進入 OAuth 2.0 Client ID 詳細頁面
   - 確認「已授權的重新導向 URI」包含：
     ```
     https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
     ```
   - 如果沒有，請加入並儲存

### 步驟 4: 清除並重新測試

1. **清除瀏覽器快取和 Cookies**
2. **等待 5-10 分鐘**（讓 Google 的設定生效）
3. **重新測試登入**

---

## 🔍 詳細診斷步驟

### 診斷 1: 檢查 Supabase 設定

請截圖 Supabase Dashboard 中的 Google Provider 設定頁面，確認：
- Enable Sign in with Google: ✅ ON
- Client IDs: 完整顯示
- Client Secret: 已填入（即使顯示為 `•••••`）
- Callback URL: 顯示正確

### 診斷 2: 檢查 Google Cloud Console

請確認以下項目：
1. OAuth 2.0 Client ID 狀態：**已啟用**
2. 應用程式類型：**網頁應用程式**
3. Redirect URIs: 包含 Supabase callback URL

### 診斷 3: 測試連接

使用瀏覽器開發者工具（F12）查看 Network 標籤：
1. 點擊「使用 Google 登入」
2. 查看跳轉的 URL
3. 檢查 URL 中的 `client_id` 參數是否正確

---

## ⚠️ 常見錯誤範例

### ❌ 錯誤範例 1: Client ID 多餘空格
```
817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com 
                                                                    ↑ 多餘空格
```

### ❌ 錯誤範例 2: Client ID 缺少部分
```
817238464028-qot5sc882lgp90f8fq5fhk85bni11q27
                                                           ↑ 缺少 .apps.googleusercontent.com
```

### ❌ 錯誤範例 3: Redirect URI 錯誤
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback/
                                                         ↑ 多餘斜線

tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
↑ 缺少 https://
```

---

## ✅ 正確設定範例

### Supabase Dashboard:
```
Enable Sign in with Google: ✅ ON
Client IDs: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
Client Secret (for OAuth): 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
Callback URL: https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

### Google Cloud Console:
```
應用程式類型: 網頁應用程式
Client ID: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
已授權的重新導向 URI:
  - https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
  - https://megan.tonetown.ai/auth/callback
  - http://localhost:3000/auth/callback
```

---

## 🎯 下一步行動

請按照以下順序檢查：

1. ✅ **重新驗證 Supabase 中的 Client ID**（逐字檢查）
2. ✅ **重新驗證 Supabase 中的 Client Secret**
3. ✅ **確認已點擊 Save 按鈕**
4. ✅ **等待 5-10 分鐘**
5. ✅ **清除瀏覽器快取後重新測試**

如果以上都確認無誤，但仍出現錯誤，請提供：
- Supabase Google Provider 設定頁面的截圖
- 瀏覽器 Console 的錯誤訊息（F12 → Console）

