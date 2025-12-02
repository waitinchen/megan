# 🔍 OAuth 錯誤檢查報告

## 發現的問題

### ❌ 問題 1: redirectTo 設定錯誤

**當前設定** (`app/login/page.tsx` 第 32 行):
```tsx
redirectTo: `${window.location.origin}/welcome`,
```

**問題**:
- Supabase OAuth 流程中，`redirectTo` 應該指向 Next.js 的 callback 路由
- 但實際上，Supabase 會先將用戶導向 Supabase 的 callback URL
- 然後我們需要在 callback 路由中再導向到 /welcome

**應該改為**:
```tsx
redirectTo: `${window.location.origin}/auth/callback`,
```

---

### ⚠️ 問題 2: Google Cloud Console 端口錯誤

從圖片中看到：
- **已授權的 JavaScript 來源** 中有：`http://localhost:30000`
- 但應用程式實際運行在：`http://localhost:3000`

**需要修正**:
- 將 `http://localhost:30000` 改為 `http://localhost:3000`

---

### ❌ 問題 3: Supabase 中可能未設定 Client ID 和 Secret

**需要確認**:
1. Supabase Dashboard → Authentication → Providers → Google
2. 是否已啟用 Google Provider
3. 是否已填入：
   - Client ID: `817238464028-qot5sc882lqp90f8fq5fhk85bni11q27.apps.googleusercontent.com`
   - Client Secret: (需要從 Google Cloud Console 獲取)

---

## ✅ 已正確設定的項目

1. **Google Cloud Console Redirect URIs**:
   - ✅ `https://tqummhyhohacbkmpsgae.supabase.co/auth/v1/callback`
   - ✅ `https://megan.tonetown.ai/auth/callback`
   - ✅ `http://localhost:3000/auth/callback`

2. **OAuth Client ID**:
   - ✅ `817238464028-qot5sc882lqp90f8fq5fhk85bni11q27.apps.googleusercontent.com`

---

## 🔧 需要立即修正的項目

1. **修正 redirectTo** (優先級: 高)
2. **修正 Google Cloud Console 端口** (優先級: 中)
3. **確認 Supabase 設定** (優先級: 高)







