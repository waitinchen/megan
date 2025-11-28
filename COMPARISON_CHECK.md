# 🔍 Client ID 和 Callback URL 比對檢查

## 📋 提供的值

### Client ID:
```
817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
```

### Callback URL:
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

---

## ⚠️ 發現的可疑問題

### 問題 1: Supabase 中的 Client ID 可能被截斷

從圖片中看到 Supabase 設定頁面顯示：
```
817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleuserco
```

**比對**：
- ✅ 正確完整值: `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
- ❌ 圖片顯示值: `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleuserco`

**問題**：缺少了 `ntent.com` 部分！

**可能原因**：
1. 輸入欄位寬度限制，只是顯示被截斷（但實際值可能是完整的）
2. 實際儲存的值確實不完整
3. 複製時遺漏了部分字元

---

### 問題 2: Supabase 中的 Callback URL 可能被截斷

從圖片中看到 Supabase 設定頁面顯示：
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/calll
```

**比對**：
- ✅ 正確完整值: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
- ❌ 圖片顯示值: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/calll`

**問題**：缺少了 `back` 部分！

**注意**：這個 Callback URL 通常由 Supabase 自動生成，不應該被修改。如果顯示不完整，可能是：
1. 只是顯示問題（實際值完整）
2. 需要重新整理頁面

---

## ✅ 正確的完整值

### Client ID（必須完全一致）:
```
817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
```

**字元數**: 72 個字元
**結尾**: `.apps.googleusercontent.com`

### Callback URL:
```
https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback
```

**字元數**: 62 個字元
**結尾**: `/auth/v1/callback`

---

## 🔧 檢查步驟

### 步驟 1: 確認 Supabase 中的 Client ID

1. **前往 Supabase Dashboard**:
   - Authentication → Providers → Google

2. **檢查 Client IDs 欄位**:
   - 點擊輸入框，查看完整內容
   - 或選取全部文字（Ctrl+A）複製
   - 貼到文字編輯器檢查長度

3. **確認是否完整**:
   - 應該以 `.apps.googleusercontent.com` 結尾
   - 總長度應該是 72 個字元
   - 如果被截斷，請重新貼上完整值

### 步驟 2: 確認 Callback URL

1. **檢查 Callback URL 欄位**:
   - 這個欄位通常是唯讀的
   - 如果顯示不完整，可能是顯示問題
   - 嘗試重新整理頁面

2. **確認 Google Cloud Console**:
   - 確認 Redirect URI 包含完整的 URL
   - 應該是: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`

---

## 🎯 關鍵檢查點

### Client ID 必須：
- ✅ 以 `.apps.googleusercontent.com` 結尾
- ✅ 總共 72 個字元
- ✅ 與 Google Cloud Console 中的完全一致

### Callback URL 必須：
- ✅ 以 `/auth/v1/callback` 結尾
- ✅ 包含完整的 `https://` 前綴
- ✅ 與 Google Cloud Console 中的 Redirect URI 完全一致

---

## 🚨 如果發現問題

### 如果 Client ID 不完整：

1. **清空 Supabase 中的 Client IDs 欄位**
2. **從 Google Cloud Console 重新複製完整值**:
   ```
   817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com
   ```
3. **貼到 Supabase 的 Client IDs 欄位**
4. **檢查是否完整顯示**
5. **點擊 Save**

### 如果 Callback URL 顯示不完整：

1. **重新整理 Supabase 頁面**
2. **檢查 Google Cloud Console 中的 Redirect URI**
3. **確認是否包含完整的 Supabase callback URL**

---

## 📝 完整比對清單

### Google Cloud Console 設定：
- ✅ Client ID: `817238464028-qot5sc882lgp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
- ✅ Redirect URI: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`

### Supabase Dashboard 設定（需要確認）：
- ❓ Client IDs: 應該完全匹配上面的 Client ID
- ✅ Callback URL: `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`（由 Supabase 自動生成）

---

## 💡 建議

1. **使用複製/貼上**，不要手動輸入
2. **貼上後檢查結尾**，確認完整
3. **使用文字編輯器驗證**，複製後貼到記事本檢查
4. **逐字比對**，確保沒有遺漏

---

**最關鍵的問題**：如果 Supabase 中的 Client ID 確實被截斷（缺少 `ntent.com`），這就是導致 "invalid_client" 錯誤的根本原因！

