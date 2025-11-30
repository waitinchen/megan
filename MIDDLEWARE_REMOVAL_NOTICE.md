# 📮 Middleware.ts 移除通知 — Next.js 16 Cookie 錯誤修復

**日期**: 2025-01-XX  
**狀態**: ✅ 已完成

---

## 📌 為什麼要移除

為了修復近期後端 API 出現的錯誤：

```
TypeError: this.context.cookies(...).get is not a function
```

我們已正式**移除專案根目錄的 `middleware.ts`**（Supabase 舊版 Middleware）。

### 原因

1. **Next.js 16 已不再支援舊的 middleware cookies API**
2. **`createMiddlewareClient()` 屬於已棄用的 Supabase Auth Helper**
3. **保留 middleware.ts 會導致**：
   - Route Handler 無法正確讀取 cookies
   - Supabase session 無法傳遞
   - `/api/favorites`, `/api/conversations` 全部報 500
   - Railway log 出現 `this.context.cookies(...).get is not a function`

---

## 📌 現在的架構

現在所有 session 驗證與 cookies 管理全部改由：

```typescript
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
```

在 **API Route Handlers** 中處理，不再需要 middleware。

### 範例：API Route Handler

```typescript
// app/api/favorites/route.ts
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return unauthorized();
    }

    // ... rest of your code
  } catch (error: any) {
    console.error('[API] Error:', error);
    return serverError(typeof error === 'string' ? error : error?.message || 'Unknown error');
  }
}
```

---

## 📌 已更新的 API Routes

以下 API routes 已全部更新為新的 cookies 模式：

- ✅ `app/api/favorites/route.ts`
- ✅ `app/api/conversations/route.ts`
- ✅ `app/api/timeline/route.ts`
- ✅ `app/api/user/route.ts`
- ✅ `app/api/auth/wechat/callback/route.ts`

---

## 📌 接下來你不用做什麼

整個環境已更新，部署完成。

你只要依照原本方式開發 API 即可，**不需要 middleware**。

---

## 📌 關鍵要點

### ✅ 正確的使用方式

```typescript
// 在 API Route Handler 中
const cookieStore = cookies();
const supabase = createRouteHandlerClient({ 
  cookies: () => cookieStore 
});
```

### ❌ 不再使用的舊方式

```typescript
// 舊的 middleware.ts 方式（已棄用）
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const supabase = createMiddlewareClient({ req, res });
  // ❌ 這會導致 cookies API 錯誤
}
```

---

## 📌 相關資源

如需更多技術細節，可參考：

- **新的 Supabase SSR 樣板**: 見各 API Route Handler 實作
- **API Route Handler session template**: 見 `app/api/favorites/route.ts`
- **Cookies 調試指南**: 見 `FIX_COOKIES_ERROR.md`

---

**— 威廷 / 謀謀**

