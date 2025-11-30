# 🔍 "invalid_client" 錯誤診斷檢查清單

## ❌ 當前錯誤

```
錯誤 401：invalid_client
要求詳情： flowName=GeneralOAuthFlow
```

---

## 🎯 問題根源分析

這個錯誤表示：**Google 無法識別你的 OAuth 客戶端**

### 可能原因（按可能性排序）：

1. **Supabase 中的 Client ID 不完整**（最可能）
   - 圖片顯示可能缺少 `ntent.com` 部分
   - 應該是完整的 72 個字元

2. **Supabase 中的 Client Secret 與 Google Cloud Console 不匹配**

3. **設定未正確儲存**

---

## ✅ 立即診斷步驟

### 診斷 1: 檢查 Supabase Client ID 是否完整

#### 步驟：
1. 前往 Supabase Dashboard → Authentication → Providers → Google
2. 找到 **Client IDs** 欄位
3. **選取全部文字**（在輸入框中按 Ctrl+A）
4. **複製**（Ctrl+C）
5. **貼到文字編輯器**（如記事本）
6. **檢查以下項目**：

#### ✅ 應該符合的條件：
- [ ] 總長度：**72 個字元**
- [ ] 開頭：`817238464028-`
- [ ] 結尾：`.apps.googleusercontent.com`
- [ ] 完整值：`817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`

#### ❌ 如果發現問題：
- Client ID 被截斷 → **立即修復**
- 結尾是 `.apps.googleuserco` → **缺少 `ntent.com`** → **立即修復**
- 長度不是 72 個字元 → **立即修復**

---

### 診斷 2: 檢查 Client Secret 是否匹配

#### 步驟：
1. Google Cloud Console → APIs & Services → Credentials
2. 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`
3. 查看 Client Secret（可能需要重設才能看到完整值）

#### 目前已知的值：
```
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
```

#### ✅ 應該符合的條件：
- [ ] 開頭：`GOCSPX-`
- [ ] 長度：約 39 個字元
- [ ] 與 Google Cloud Console 中的完全一致

#### 檢查 Supabase 中的值：
1. Supabase Dashboard → Authentication → Providers → Google
2. 查看 **Client Secret (for OAuth)** 欄位
3. 如果顯示為 `••••••••`，點擊眼睛圖示查看
4. 確認是否與 Google Cloud Console 中的完全一致

---

### 診斷 3: 檢查 Redirect URI 設定

#### Google Cloud Console 中必須包含：
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

#### 檢查步驟：
1. Google Cloud Console → APIs & Services → Credentials
2. 點擊 OAuth 2.0 Client ID
3. 檢查「已授權的重新導向 URI」
4. 確認包含上面的完整 URL

---

## 🔧 修復步驟（按順序執行）

### 修復步驟 1: 完全重置 Supabase 設定

1. **Supabase Dashboard → Authentication → Providers → Google**
2. 取消勾選「Enable Sign in with Google」
3. 清空 Client IDs 欄位
4. 清空 Client Secret 欄位
5. 點擊 **Save**
6. 等待 5 秒

---

### 修復步驟 2: 從 Google Cloud Console 獲取正確值

1. **Google Cloud Console → APIs & Services → Credentials**
2. 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`

#### 複製 Client ID：
- 完整值：`817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
- 確認長度：**72 個字元**
- 確認結尾：`.apps.googleusercontent.com`

#### 複製 Client Secret：
- 如果看不到完整值，可能需要「重設密鑰」
- 新值應該是：`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`（或類似的格式）
- 確認開頭：`GOCSPX-`

---

### 修復步驟 3: 重新設定 Supabase

1. **Supabase Dashboard → Authentication → Providers → Google**

2. **勾選「Enable Sign in with Google」**

3. **填入 Client IDs**：
   - 清空欄位
   - 貼上完整值：`817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
   - **檢查是否完整顯示**（不要只看輸入框，要確認完整值）

4. **填入 Client Secret**：
   - 清空欄位
   - 貼上完整值
   - **檢查是否正確**

5. **確認 Callback URL**：
   - 應該顯示：`https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
   - 如果不完整，重新整理頁面

6. **點擊 Save**
   - 等待儲存完成
   - 確認沒有錯誤訊息

---

### 修復步驟 4: 驗證一致性

#### 使用文字編輯器驗證：

1. **從 Supabase 複製 Client ID**（Ctrl+A → Ctrl+C）
2. **從 Google Cloud Console 複製 Client ID**（Ctrl+A → Ctrl+C）
3. **貼到兩個不同的文字編輯器**
4. **逐字比較**，確保：
   - ✅ 完全一致
   - ✅ 沒有多餘空格
   - ✅ 沒有遺漏字元
   - ✅ 大小寫一致

---

### 修復步驟 5: 等待並測試

1. **等待 5-10 分鐘**（讓 Google 設定生效）

2. **清除瀏覽器**：
   - 清除快取和 Cookies
   - 或使用無痕模式

3. **測試登入**：
   - 訪問 `http://localhost:3000/login`
   - 點擊「使用 Google 登入」

---

## 🚨 關鍵檢查點總結

### Client ID 必須：
- ✅ 72 個字元
- ✅ 以 `.apps.googleusercontent.com` 結尾
- ✅ 與 Google Cloud Console 完全一致

### Client Secret 必須：
- ✅ 以 `GOCSPX-` 開頭
- ✅ 與 Google Cloud Console 完全一致

### Redirect URI 必須：
- ✅ 包含 `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
- ✅ 在 Google Cloud Console 中已設定

---

## 📋 快速檢查命令（可選）

如果你熟悉開發者工具，可以：

1. **打開瀏覽器開發者工具**（F12）
2. **切換到 Console 標籤**
3. **執行以下檢查**：

```javascript
// 檢查 Supabase 設定（需要在瀏覽器中執行）
fetch('/api/health-check')
  .then(r => r.json())
  .then(data => {
    console.log('Health Check:', data);
  });
```

---

## ✅ 成功標誌

當設定正確時，你會看到：
- ✅ 點擊「使用 Google 登入」後，跳轉到 Google 登入頁面
- ✅ 沒有 "invalid_client" 錯誤
- ✅ 可以正常完成登入流程

---

**最重要的一點**：確保 Supabase 中的 Client ID 是**完整的 72 個字元**，並且以 `.apps.googleusercontent.com` 結尾！


