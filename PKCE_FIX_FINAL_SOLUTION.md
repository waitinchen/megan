# 🔧 PKCE Code Verifier 丟失最終修復方案

## ❗ 問題分析

從生產環境錯誤日誌確認：

```
[OAuth Callback] SessionStorage PKCE keys: []
[OAuth Callback] No PKCE keys found in sessionStorage!
AuthApiError: invalid request: both auth code and code verifier should be non-empty
Multiple GoTrueClient instances detected
```

### 根本原因

1. **多個 Supabase 客戶端實例**
   - 多個頁面仍在使用 `createClientComponentClient`
   - 導致多個 GoTrueClient 實例
   - 存儲鍵衝突

2. **PKCE code_verifier 未存儲**
   - 從日誌看，沒有 `SET: ...pkce...` 日誌
   - 說明 Supabase 在 `signInWithOAuth` 時沒有存儲 code_verifier
   - 可能是因為自定義 storage 適配器導致問題

---

## ✅ 最終修復方案

### 方案 1：使用 Supabase 默認行為（推薦）

**關鍵改變**：不傳遞自定義 storage 適配器，讓 Supabase 使用默認的 sessionStorage。

```typescript
// 不設置 storage 參數
clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // 不設置 storage，使用默認的 sessionStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
```

**優點**：
- ✅ Supabase 會自動處理 PKCE code_verifier
- ✅ 使用默認的存儲機制，最可靠
- ✅ 不需要自定義適配器

### 方案 2：統一所有客戶端創建（必須）

**需要更新所有使用 `createClientComponentClient` 的頁面**：

- [ ] `app/page.tsx`
- [ ] `app/welcome/page.tsx`
- [ ] `app/dashboard/layout.tsx`
- [ ] `app/dashboard/*/page.tsx` (所有 dashboard 頁面)

**改為使用**：
```typescript
import { createClient } from '@/app/utils/supabase/client'
const supabase = createClient()
```

---

## 🚨 如果方案 1 仍然失敗

### 臨時解決方案：使用 localStorage

如果 sessionStorage 在 OAuth redirect 時被清除，可以暫時使用 localStorage：

```typescript
clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
})
```

**注意**：localStorage 在跨標籤頁共享，安全性較低，但可以解決 redirect 清除的問題。

---

## 📋 執行步驟

### 步驟 1：測試當前修復

1. 等待 Railway 部署完成
2. 清除瀏覽器狀態：
   ```javascript
   sessionStorage.clear()
   localStorage.clear()
   ```
3. 測試 Google 登入
4. 觀察控制台日誌：
   - 應該看到 `[Supabase Storage] SET: ...pkce...` 日誌
   - 應該看到 `[Supabase Storage] GET: ...pkce...` 日誌

### 步驟 2：如果仍然失敗

執行以下診斷：

```javascript
// 在登錄頁面點擊 "使用 Google 登入" 後立即執行
console.log('All sessionStorage keys:', Object.keys(sessionStorage))
console.log('All localStorage keys:', Object.keys(localStorage))
```

檢查是否有 PKCE 相關的鍵。

### 步驟 3：如果沒有 PKCE 鍵

這表示 Supabase 沒有存儲 code_verifier。可能原因：
- Supabase 配置問題
- 需要使用 localStorage（臨時方案）

---

## 🎯 預期結果

修復後應該：

- ✅ 看到 `[Supabase Storage] SET: sb-xxx-pkce-code-verifier` 日誌
- ✅ Callback 時能讀取到 code_verifier
- ✅ 成功交換 session
- ✅ 不再出現 "Multiple GoTrueClient instances" 警告

---

**當前狀態**: 🔴 測試中  
**下一步**: 等待部署後測試，根據結果決定是否需要使用 localStorage

