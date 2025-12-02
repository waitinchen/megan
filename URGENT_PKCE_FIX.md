# 🚨 PKCE Code Verifier 丟失緊急修復指南

## ❗ 當前問題

從生產環境錯誤日誌看到：

```
[OAuth Callback] SessionStorage PKCE keys: []
[OAuth Callback] No PKCE keys found in sessionStorage!
AuthApiError: invalid request: both auth code and code verifier should be non-empty
```

**問題**：PKCE code_verifier 在 OAuth redirect 過程中丟失。

---

## 🔍 可能的原因

### 1. OAuth Redirect 清除 sessionStorage

**最可能的原因**：某些瀏覽器或安全設置在跨域 redirect 時清除 sessionStorage。

### 2. 存儲鍵格式不匹配

Supabase 可能使用特定的鍵格式，我們的適配器可能沒有正確處理。

### 3. 多個客戶端實例衝突

雖然已實現單例，但可能仍有衝突。

---

## ✅ 緊急修復方案

### 方案 A：使用 localStorage 替代 sessionStorage（臨時方案）

如果 sessionStorage 在 redirect 時被清除，可以暫時使用 localStorage：

```typescript
// 在 app/utils/supabase/client.ts 中
storage: typeof window !== 'undefined' ? window.localStorage : undefined,
```

**注意**：這不是最佳實踐，但可以作為臨時解決方案。

### 方案 B：在 OAuth 開始前手動存儲 code_verifier

修改登錄流程，在 `signInWithOAuth` 之前手動生成並存儲 code_verifier。

### 方案 C：檢查 Supabase 配置

確認 Supabase Dashboard 中的 OAuth 設置：
- PKCE 是否啟用
- Redirect URLs 是否正確
- Site URL 是否正確

---

## 🔧 立即執行的診斷步驟

### 1. 檢查 sessionStorage 是否可用

在瀏覽器控制台執行：

```javascript
// 測試 sessionStorage
try {
  sessionStorage.setItem('test', 'value')
  const value = sessionStorage.getItem('test')
  console.log('SessionStorage test:', value === 'value' ? 'OK' : 'FAILED')
  sessionStorage.removeItem('test')
} catch (e) {
  console.error('SessionStorage not available:', e)
}
```

### 2. 檢查 OAuth 流程中的存儲

在登錄頁面點擊 "使用 Google 登入" 後，立即檢查：

```javascript
// 在控制台執行
console.log('All sessionStorage keys:', Object.keys(sessionStorage))
console.log('PKCE keys:', Object.keys(sessionStorage).filter(k => k.includes('pkce')))
```

### 3. 檢查 Supabase 存儲鍵格式

Supabase 使用的鍵格式通常是：
- `sb-{project-ref}-auth-token`
- `sb-{project-ref}-pkce-code-verifier`

檢查這些鍵是否存在。

---

## 🎯 推薦的修復步驟

### 步驟 1：確認問題

1. 清除所有存儲：
   ```javascript
   sessionStorage.clear()
   localStorage.clear()
   ```

2. 嘗試登入，觀察控制台日誌

3. 檢查是否有 `[Supabase Storage] SET: ...pkce...` 日誌

### 步驟 2：如果沒有 SET 日誌

這表示 Supabase 沒有嘗試存儲 code_verifier。可能原因：
- PKCE 未正確啟用
- Supabase 配置問題

### 步驟 3：如果有 SET 日誌但 GET 時找不到

這表示存儲在 redirect 時被清除。解決方案：
- 使用 localStorage（臨時）
- 或檢查瀏覽器安全設置

---

## 📝 臨時解決方案（如果急需修復）

如果需要立即修復，可以暫時使用 localStorage：

```typescript
// app/utils/supabase/client.ts
storage: typeof window !== 'undefined' ? window.localStorage : undefined,
```

**警告**：localStorage 在跨標籤頁共享，安全性較低，但可以解決 redirect 清除的問題。

---

## 🔍 調試日誌說明

修復後的代碼會輸出詳細的調試日誌：

- `[Supabase Storage] GET: ...` - 讀取存儲
- `[Supabase Storage] SET: ...` - 寫入存儲
- `[Supabase Storage] REMOVE: ...` - 刪除存儲

這些日誌可以幫助診斷問題。

---

**狀態**: 🔴 緊急修復中  
**下一步**: 等待部署後測試，根據調試日誌進一步診斷


