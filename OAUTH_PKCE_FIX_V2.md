# 🔧 OAuth PKCE 修復 v2.0

## ❗ 問題診斷

根據生產環境錯誤日誌：

```
[OAuth Callback] SessionStorage PKCE keys: []
[OAuth Callback] No PKCE keys found in sessionStorage!
AuthApiError: invalid request: both auth code and code verifier should be non-empty
Multiple GoTrueClient instances detected
```

### 根本原因

1. **客戶端不一致**：
   - 登錄頁面使用 `createClientComponentClient` (from `@supabase/auth-helpers-nextjs`)
   - Callback 頁面使用 `createClient` (from `@/app/utils/supabase/client`)
   - 兩個客戶端使用不同的存儲機制和鍵名

2. **多個 GoTrueClient 實例**：
   - 每次調用 `createClient()` 都創建新實例
   - 導致存儲鍵衝突和狀態不一致

---

## ✅ 修復方案

### 1. 統一客戶端創建方式

**更新文件**: `app/login/page.tsx`

```typescript
// 之前
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
const supabase = createClientComponentClient();

// 之後
import { createClient } from '@/app/utils/supabase/client';
const supabase = createClient();
```

### 2. 實現單例模式

**更新文件**: `app/utils/supabase/client.ts`

- ✅ 實現單例模式，確保整個應用只有一個客戶端實例
- ✅ 避免 "Multiple GoTrueClient instances" 警告
- ✅ 確保所有組件使用相同的存儲鍵

### 3. 明確指定 PKCE Flow

```typescript
auth: {
  flowType: 'pkce', // 明確指定使用 PKCE flow
  storage: sessionStorage, // 使用 sessionStorage
  ...
}
```

---

## 🔍 修復詳情

### 關鍵變更

1. **登錄頁面** (`app/login/page.tsx`)
   - ✅ 改用統一的 `createClient()`
   - ✅ 確保與 callback 頁面使用相同的客戶端

2. **客戶端工具** (`app/utils/supabase/client.ts`)
   - ✅ 實現單例模式
   - ✅ 添加自定義存儲適配器
   - ✅ 明確指定 PKCE flow
   - ✅ 添加錯誤處理

---

## 📋 驗證步驟

部署後，請測試：

1. **清除瀏覽器緩存和 sessionStorage**
   ```javascript
   // 在瀏覽器控制台執行
   sessionStorage.clear()
   localStorage.clear()
   ```

2. **測試 OAuth 登入**
   - 訪問 https://megan.tonetown.ai/login
   - 點擊 "使用 Google 登入"
   - 完成 OAuth 授權

3. **檢查控制台**
   - ✅ 應該看到：`[OAuth Callback] Session created successfully`
   - ❌ 不應該看到：`SessionStorage PKCE keys: []`
   - ❌ 不應該看到：`Multiple GoTrueClient instances`

---

## 🎯 預期結果

修復後應該：

- ✅ PKCE code_verifier 正確存儲在 sessionStorage
- ✅ Callback 頁面能正確讀取 code_verifier
- ✅ 成功交換 session
- ✅ 不再出現多個 GoTrueClient 實例警告
- ✅ OAuth 登入流程完全正常

---

## 📝 技術細節

### 存儲鍵格式

Supabase 使用以下格式的存儲鍵：
- Session token: `sb-{project-ref}-auth-token`
- PKCE code_verifier: `sb-{project-ref}-pkce-code-verifier`

通過使用統一的客戶端實例，確保所有組件使用相同的鍵名。

### 單例模式實現

```typescript
let clientInstance: SupabaseClient | null = null

export function createClient(): SupabaseClient {
  if (clientInstance) {
    return clientInstance
  }
  // 創建新實例...
  return clientInstance
}
```

這確保整個應用只有一個 Supabase 客戶端實例。

---

**修復完成時間**: 2024-12-19  
**狀態**: ✅ 已修復，待部署驗證


