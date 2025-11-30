# 🔧 修復 `this.context.cookies(...).get is not a function` 錯誤

## 問題描述

在 `/api/conversations` 路由中出現 500 錯誤：
```
INTERNAL_ERROR: this.context.cookies(...).get is not a function
```

## 根本原因

這個錯誤表示代碼中仍然使用了舊的 Next.js Pages Router 的 `cookies` API，而不是 App Router 的新 API。

## ✅ 正確的寫法（App Router）

在 Next.js 16 App Router 中，**必須**使用以下模式：

```typescript
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ 
    cookies: () => cookieStore 
  });
  
  // ... rest of your code
}
```

## ❌ 錯誤的寫法（會導致錯誤）

以下寫法會導致 `this.context.cookies(...).get is not a function` 錯誤：

```typescript
// ❌ 錯誤 1: 直接使用 this.context
const cookie = this.context.cookies().get("userId");

// ❌ 錯誤 2: 在 Request 對象上使用 cookies
const cookie = request.cookies.get("userId");

// ❌ 錯誤 3: 直接傳遞 cookies 而不是函數
const supabase = createRouteHandlerClient({ cookies: cookieStore });
```

## 已修復的文件

✅ `app/api/conversations/route.ts` - 已更新為正確模式
✅ `app/api/favorites/route.ts` - 已使用正確模式
✅ `app/api/timeline/route.ts` - 已使用正確模式
✅ `app/api/user/route.ts` - 已使用正確模式
✅ `app/api/auth/wechat/callback/route.ts` - 已使用正確模式

## 檢查清單

如果問題仍然存在，請檢查：

### 1. 清除緩存
```bash
# 清除 Next.js 緩存
rm -rf .next

# 重新構建
pnpm build
```

### 2. 檢查環境變數
確保 `.env.local` 中有正確的 Supabase 配置：
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

### 3. 檢查 Supabase 版本
確保 `package.json` 中有正確的版本：
```json
{
  "dependencies": {
    "@supabase/auth-helpers-nextjs": "^0.10.0",
    "@supabase/supabase-js": "^2.86.0",
    "next": "16.0.3"
  }
}
```

### 4. 檢查所有 API Routes
確保所有 API routes 都使用正確的模式：

```bash
# 搜尋可能錯誤的用法
grep -r "this.context.cookies" app/api/
grep -r "request.cookies.get" app/api/
grep -r "req.cookies" app/api/
```

如果找到任何結果，需要修復它們。

## 調試步驟

1. **檢查瀏覽器控制台**
   - 打開 DevTools → Console
   - 查看完整的錯誤訊息和堆棧跟踪

2. **檢查服務器日誌**
   - 查看 Railway/部署平台的日誌
   - 確認錯誤發生在哪個函數

3. **測試 API 端點**
   ```bash
   # 測試 conversations API
   curl -X GET http://localhost:3000/api/conversations \
     -H "Cookie: your-session-cookie"
   ```

4. **確認 Session 存在**
   - 確保用戶已登錄
   - 檢查 Supabase session 是否有效

## 如果問題仍然存在

如果修復後問題仍然存在，可能是：

1. **部署緩存問題**
   - 在 Railway 或其他平台上清除構建緩存
   - 重新部署應用

2. **版本不匹配**
   ```bash
   # 更新依賴
   pnpm update @supabase/auth-helpers-nextjs @supabase/supabase-js
   ```

3. **中間件已移除**
   - ✅ `middleware.ts` 已移除（使用舊版 Supabase Auth Helper）
   - ✅ 現在所有 session 驗證都在 API Route Handlers 中處理
   - ✅ 使用 `createRouteHandlerClient` 代替 `createMiddlewareClient`

## 參考資料

- [Next.js 16 Cookies Documentation](https://nextjs.org/docs/app/api-reference/functions/cookies)
- [Supabase Auth Helpers Next.js](https://github.com/supabase/auth-helpers/tree/main/packages/nextjs)

