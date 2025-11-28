# 🔧 Session 持久化與 Cookies API 修復指南

## 🐛 問題描述

從截圖看到的兩個錯誤：

### 1. 對話歷史載入失敗
**錯誤訊息**：`載入失敗: this.context.cookies(...).get is not a function`

**路徑**：https://megan.tonetown.ai/dashboard/history

**原因**：Next.js 16 中 cookies() API 使用方式錯誤

### 2. 無法長期保持登入狀態
**問題**：用戶希望登入後能長期保持登入狀態，不需要頻繁重新登入

**原因**：缺少 Supabase session 自動刷新機制

---

## ✅ 解決方案

### 修復 1: Cookies API 錯誤

**問題根源**：
在 Next.js 16 中，`createRouteHandlerClient` 需要直接接收 `cookies` 函數引用，而不是 awaited 的結果。

**修復的文件**：
1. [app/api/conversations/route.ts](app/api/conversations/route.ts) - 對話歷史 API
2. [app/api/favorites/route.ts](app/api/favorites/route.ts) - 收藏 API
3. [app/api/user/route.ts](app/api/user/route.ts) - 用戶資料 API
4. [app/auth/callback/route.ts](app/auth/callback/route.ts) - Google OAuth 回調
5. [app/api/auth/wechat/callback/route.ts](app/api/auth/wechat/callback/route.ts) - 微信 OAuth 回調

**修復方式**：
```typescript
// ❌ 錯誤寫法（會導致錯誤）
const cookieStore = await cookies();
const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

// ✅ 正確寫法
const supabase = createRouteHandlerClient({ cookies });
```

### 修復 2: Session 持久化

**新增文件**：[middleware.ts](middleware.ts)

**功能**：
- 自動刷新過期的 session
- 保持用戶長期登入狀態
- Supabase SDK 自動處理 token refresh

**運作原理**：
```typescript
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 自動刷新 session（如果需要）
  await supabase.auth.getSession();

  return res;
}
```

**Middleware 匹配規則**：
- ✅ 所有頁面和 API 路由
- ❌ 靜態文件 (_next/static)
- ❌ 圖片優化 (_next/image)
- ❌ Public 文件 (.png, .jpg 等)

### 額外修復

**app/api/user/route.ts** - 移除手動設置 `updated_at`：
```typescript
// Before
.update({
  nickname: nickname.trim(),
  updated_at: new Date().toISOString(), // ❌ 手動設置
})

// After
.update({
  nickname: nickname.trim(), // ✅ 資料庫自動處理
})
```

---

## 🧪 測試步驟

### 1. 測試對話歷史功能

1. 登入 Dashboard: https://megan.tonetown.ai/dashboard/history
2. 應該能正常載入對話列表
3. ✅ **不再出現** `this.context.cookies(...).get is not a function` 錯誤

### 2. 測試長期登入

1. 登入系統
2. 關閉瀏覽器（完全關閉，不只是分頁）
3. 重新打開瀏覽器，訪問 https://megan.tonetown.ai
4. ✅ **應該自動保持登入狀態**，不需要重新登入
5. 即使過了幾天，token 也會自動刷新

### 3. 測試其他 Dashboard 功能

- ✅ Dashboard > 個人資料：暱稱修改
- ✅ Dashboard > 收藏對話：查看收藏
- ✅ Dashboard > 默契記憶：查看記憶
- ✅ Dashboard > 帳號綁定：查看綁定狀態

---

## 📊 技術細節

### Session 刷新機制

Supabase 使用 JWT tokens：
- **Access Token**：短期（1小時）
- **Refresh Token**：長期（可配置，默認數週）

**Middleware 的作用**：
1. 每次請求時檢查 access token 是否過期
2. 如果過期，自動使用 refresh token 獲取新的 access token
3. 更新 cookies 中的 session
4. 用戶無感知，體驗流暢

### Next.js 16 Cookies API

**重要概念**：
```typescript
import { cookies } from 'next/headers';

// cookies 本身就是一個 async function
// 直接傳遞給 Supabase client，讓它內部處理
const supabase = createRouteHandlerClient({ cookies });
```

**為什麼這樣設計？**
- Supabase SDK 需要在內部多次調用 cookies()
- 傳遞函數引用而非結果，允許 SDK 控制調用時機
- 支援動態 cookie 讀寫

---

## ✅ 驗證清單

- [x] **修復 Cookies API**：所有 API 路由使用正確的 cookies 模式
- [x] **添加 Middleware**：自動 session 刷新機制
- [x] **移除手動 updated_at**：讓資料庫自動處理時間戳
- [x] **Build 成功**：所有 TypeScript 類型檢查通過
- [ ] **測試對話歷史**：確認不再出現錯誤
- [ ] **測試長期登入**：關閉瀏覽器後重新訪問

---

## 🎉 預期結果

修復完成後：

1. ✅ **對話歷史頁面正常載入**，不再出現 cookies 錯誤
2. ✅ **用戶保持長期登入**，即使關閉瀏覽器也不需重新登入
3. ✅ **Session 自動刷新**，用戶體驗流暢無感知
4. ✅ **所有 Dashboard 功能正常**，包括個人資料、收藏、記憶等

---

**所有修復已提交並通過 build 測試！** 🚀
