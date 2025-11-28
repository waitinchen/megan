# 🚨 關鍵修復：Client ID 被截斷問題

## ❌ 發現的關鍵問題

從 Supabase Dashboard 設定頁面看到：

### 當前顯示（可能不完整）：
```
817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleuserco
```

### 正確的完整值應該是：
```
817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
```

**問題**：缺少了 `ntent.com` 部分！

---

## ✅ 確認的設定（已正確）

根據你的確認：
- ✅ Callback URL: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
- ✅ Client Secret: `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`

---

## 🔧 必須立即修復

### 步驟 1: 驗證 Client ID 是否完整

1. **前往 Supabase Dashboard**:
   - https://supabase.com/dashboard/project/tqummhyhohacbkmpsgae/auth/providers?provider=Google

2. **檢查 Client IDs 欄位**:
   - 點擊輸入框，查看完整內容
   - 或選取全部文字（在輸入框中按 Ctrl+A）
   - 複製（Ctrl+C）
   - 貼到文字編輯器（如記事本）檢查

3. **確認是否包含完整結尾**:
   - ✅ 應該是：`.apps.googleusercontent.com`
   - ❌ 不應該是：`.apps.googleuserco`

---

### 步驟 2: 如果 Client ID 不完整，立即修復

1. **前往 Google Cloud Console**:
   - APIs & Services → Credentials
   - 點擊 OAuth 2.0 Client ID: `megan-oauth-new0`
   - 複製完整的 Client ID

2. **完整的 Client ID 應該是**:
   ```
   817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
   ```
   - **長度**: 72 個字元
   - **結尾**: `.apps.googleusercontent.com`

3. **在 Supabase 中更新**:
   - 清空 Client IDs 欄位
   - 貼上完整的 Client ID（從 Google Cloud Console 複製）
   - **確認完整顯示**
   - 點擊 **Save**

---

## 🔍 驗證方法

### 方法 1: 檢查長度

完整的 Client ID 應該是 **72 個字元**：
```
817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
123456789012345678901234567890123456789012345678901234567890123456789012
         1         2         3         4         5         6         7
```

### 方法 2: 檢查結尾

- ✅ 正確結尾：`.apps.googleusercontent.com` (22 個字元)
- ❌ 錯誤結尾：`.apps.googleuserco` (16 個字元)

### 方法 3: 使用文字編輯器驗證

1. 在 Supabase 的 Client IDs 欄位中：
   - 選取全部（Ctrl+A）
   - 複製（Ctrl+C）
2. 貼到記事本或任何文字編輯器
3. 檢查結尾是否為 `.apps.googleusercontent.com`

---

## ✅ 完整的正確設定值

### Google Cloud Console:
```
Client ID: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
Client Secret: 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
Redirect URI: https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

### Supabase Dashboard（必須完全一致）:
```
Client IDs: 817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
Client Secret: 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
Callback URL: https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

---

## 🎯 關鍵檢查點

在 Supabase Dashboard 中，Client IDs 欄位必須：

- ✅ 包含完整的 72 個字元
- ✅ 以 `.apps.googleusercontent.com` 結尾
- ✅ 與 Google Cloud Console 中的值完全一致
- ✅ 沒有任何多餘空格
- ✅ 沒有被截斷

---

## 🚨 如果仍顯示不完整

如果即使貼上完整值，輸入框顯示仍被截斷：

1. **檢查實際儲存的值**：
   - 儲存後重新整理頁面
   - 再次查看是否完整

2. **使用瀏覽器開發者工具檢查**：
   - 按 F12 打開開發者工具
   - 檢查輸入框的實際值

3. **直接從 Google Cloud Console 複製**：
   - 不要手動輸入
   - 使用複製/貼上確保完整

---

## 💡 為什麼這很重要

如果 Client ID 不完整（缺少 `ntent.com`）：
- ❌ Google 無法識別這個客戶端
- ❌ 會返回 401 "invalid_client" 錯誤
- ❌ OAuth 流程無法繼續

只有當 Client ID 是完整的 72 個字元時，Google 才能正確識別並處理 OAuth 請求。

---

**請立即檢查 Supabase 中的 Client ID 是否完整，如果不完整，請按照上述步驟修復！**

