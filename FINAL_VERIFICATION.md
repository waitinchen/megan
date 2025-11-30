# ✅ 最終驗證檢查清單

## 🎯 你已確認正確的設定

- ✅ Callback URL: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
- ✅ Client Secret: `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`
- ✅ Supabase Dashboard 設定頁面已檢查

---

## 🚨 關鍵檢查：Client ID 是否完整

### 必須確認的項目

從圖片中看到 Client IDs 欄位可能顯示不完整。請進行以下檢查：

### 檢查步驟：

1. **前往 Supabase Dashboard**:
   - https://supabase.com/dashboard/project/tqummhyhohacbkmpsgae/auth/providers?provider=Google

2. **在 Client IDs 欄位中**:
   - 點擊輸入框
   - **選取全部文字**（Ctrl+A 或 Cmd+A）
   - **複製**（Ctrl+C 或 Cmd+C）
   - **貼到文字編輯器**（記事本、VS Code 等）

3. **檢查複製出來的完整值**:
   - ✅ 應該是：`817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
   - ✅ 總長度：**72 個字元**
   - ✅ 結尾：`.apps.googleusercontent.com`

4. **如果發現不完整**:
   - ❌ 結尾是 `.apps.googleuserco`（缺少 `ntent.com`）
   - ❌ 長度不是 72 個字元
   - → **立即修復**

---

## 🔧 如果 Client ID 不完整，修復步驟

### 步驟 1: 從 Google Cloud Console 獲取完整值

1. 前往 Google Cloud Console
2. APIs & Services → Credentials
3. 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`
4. 複製完整的 Client ID：
   ```
   817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
   ```

### 步驟 2: 更新 Supabase

1. 在 Supabase Dashboard 的 Google Provider 設定頁面
2. 找到 **Client IDs** 欄位
3. **清空**現有內容
4. **貼上**剛才複製的完整 Client ID
5. **確認輸入框中顯示完整值**（可以檢查結尾）
6. 點擊 **Save**

### 步驟 3: 驗證

1. 重新整理 Supabase 頁面
2. 再次檢查 Client IDs 欄位
3. 確認顯示完整

---

## ✅ 完整設定對照表

### Google Cloud Console:
| 項目 | 值 |
|------|-----|
| Client ID | `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com` |
| Client Secret | `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` |
| Redirect URI | `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback` |

### Supabase Dashboard（必須完全一致）:
| 項目 | 應該的值 |
|------|---------|
| Enable Sign in with Google | ✅ ON |
| Client IDs | `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com` |
| Client Secret | `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` |
| Callback URL | `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback` |

---

## 🎯 最終檢查點

在 Supabase Dashboard 中確認：

- [ ] Enable Sign in with Google: **已啟用**
- [ ] Client IDs: **完整的 72 個字元**，結尾是 `.apps.googleusercontent.com`
- [ ] Client Secret: `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`
- [ ] Callback URL: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
- [ ] 已點擊 **Save** 按鈕

---

## 🧪 測試步驟

設定完成後：

1. **等待 5-10 分鐘**（讓 Google 設定生效）

2. **清除瀏覽器**:
   - 清除快取和 Cookies
   - 或使用無痕模式

3. **測試登入**:
   - 訪問 `http://localhost:3000/login`
   - 點擊「使用 Google 登入」
   - 應該能正常跳轉到 Google 登入頁面

4. **如果仍有錯誤**:
   - 檢查瀏覽器 Console（F12）
   - 確認錯誤訊息
   - 檢查 Client ID 是否確實完整

---

## 💡 提示

1. **使用複製/貼上**，不要手動輸入
2. **檢查結尾**，確認是完整的 `.apps.googleusercontent.com`
3. **使用文字編輯器驗證**，複製後貼到記事本檢查
4. **逐字比對**，確保與 Google Cloud Console 完全一致

---

**最關鍵的一點**：如果 Client ID 不完整（缺少 `ntent.com`），Google 無法識別客戶端，會持續返回 401 "invalid_client" 錯誤。

**請立即檢查 Client ID 是否完整，這是解決問題的關鍵！**


