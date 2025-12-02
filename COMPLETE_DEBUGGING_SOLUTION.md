# 🔧 完整除错方案

## 📋 问题总览

根据浏览器控制台错误，发现以下问题：

### 1. Cookies API 错误 ⚠️
**错误信息**：`this.context.cookies(...).get is not a function`

**影响范围**：
- `POST /api/favorites` → 500 Internal Server Error
- `GET /api/favorites` → 500 Internal Server Error  
- `POST /api/conversations` → 500 Internal Server Error

**错误原因**：
- 生产环境可能还在运行旧版本的代码
- 或者某些地方使用了错误的 cookies API 调用方式

### 2. OAuth PKCE 错误 ⚠️
**错误信息**：`AuthApiError: invalid request: both auth code and code verifier should be non-empty`

**影响范围**：
- OAuth 登录流程失败
- 用户无法完成 Google 登录

**错误原因**：
- PKCE code verifier 在 OAuth callback 时丢失
- 可能是 localStorage/sessionStorage 在跨域时被清除

---

## 🎯 解决方案

### 阶段一：修复 Cookies API 问题

#### Step 1: 验证所有 API 路由的 Cookies 使用方式

**检查清单**：
- [ ] `app/api/favorites/route.ts` ✅ (已正确)
- [ ] `app/api/conversations/route.ts` ✅ (已正确)
- [ ] 检查是否有其他 API 路由使用了错误的 cookies 方式

**正确的使用方式**：
```typescript
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ 
    cookies: () => cookieStore 
  });
  // ... rest of code
}
```

**错误的用法（需要修复）**：
```typescript
// ❌ 错误：直接调用 .get()
const cookieStore = cookies();
const value = cookieStore.get('key'); // 这会导致错误

// ❌ 错误：使用 this.context.cookies()
const supabase = createRouteHandlerClient({ 
  cookies: () => this.context.cookies() // 这会导致错误
});
```

#### Step 2: 检查是否有 middleware.ts 文件

```bash
# 检查是否存在 middleware.ts
ls middleware.ts

# 如果存在，检查其内容
cat middleware.ts
```

**如果存在 middleware.ts**：
- 检查是否使用了错误的 cookies API
- 考虑删除或更新它

#### Step 3: 清除构建缓存并重新部署

**Railway 部署步骤**：

1. **清除构建缓存**
   ```bash
   # 在 Railway Dashboard 中：
   # Settings → Build → Clear Build Cache
   ```

2. **强制重新构建**
   ```bash
   # 在 Railway Dashboard 中：
   # Deploy → Redeploy → Deploy Latest Commit
   ```

3. **验证部署**
   - 等待部署完成
   - 检查 Railway 日志，确认没有构建错误
   - 访问生产环境，测试 API

**本地验证**：
```bash
# 清除本地构建
rm -rf .next
rm -rf node_modules/.cache

# 重新构建
npm run build

# 本地测试
npm run start
```

---

### 阶段二：修复 OAuth PKCE 问题

#### Step 1: 检查 OAuth Callback 页面

**当前代码位置**：`app/auth/callback/page.tsx`

**问题分析**：
- `exchangeCodeForSession(code)` 需要 code verifier
- Code verifier 应该在 OAuth 开始时存储在 localStorage
- 但在 callback 时可能丢失

#### Step 2: 检查登录流程

**需要检查的文件**：
- 登录页面（`app/login/page.tsx` 或类似）
- 检查 `signInWithOAuth` 的调用方式

**正确的 PKCE 流程**：

1. **登录时**（客户端）：
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`,
    // PKCE 会自动处理，但需要确保正确配置
  }
})
```

2. **Callback 时**（客户端）：
```typescript
// 当前代码已经正确
const { error } = await supabase.auth.exchangeCodeForSession(code)
```

#### Step 3: 修复 OAuth Callback

**更新 `app/auth/callback/page.tsx`**：

```typescript
'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()
  const hasExchanged = useRef(false)

  useEffect(() => {
    async function handleOAuth() {
      if (hasExchanged.current) {
        console.log('[OAuth Callback] Already handled, skipping')
        return
      }
      hasExchanged.current = true

      try {
        // 从 URL 获取 code 和可能的错误
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        // 检查是否有错误
        if (error) {
          console.error('[OAuth Callback] OAuth error:', error, errorDescription)
          router.replace(`/login?error=${encodeURIComponent(error)}`)
          return
        }

        if (!code) {
          console.error('[OAuth Callback] No code in URL')
          router.replace('/login?error=no_code')
          return
        }

        console.log('[OAuth Callback] Exchanging code for session')
        
        // 使用 exchangeCodeForSession，Supabase 会自动处理 PKCE
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

        if (exchangeError) {
          console.error('[OAuth Callback] Error exchanging code:', exchangeError)
          
          // 如果是 PKCE 错误，提供更详细的日志
          if (exchangeError.message?.includes('code verifier')) {
            console.error('[OAuth Callback] PKCE error - code verifier missing or invalid')
            console.error('[OAuth Callback] This might be due to:')
            console.error('  1. Browser cleared localStorage/sessionStorage')
            console.error('  2. Cross-origin redirect issues')
            console.error('  3. Supabase PKCE configuration issue')
          }
          
          router.replace(`/login?error=exchange_failed&details=${encodeURIComponent(exchangeError.message)}`)
          return
        }

        // 验证 session 是否创建成功
        if (!data.session) {
          console.warn('[OAuth Callback] No session after exchange')
          router.replace('/login?error=no_session')
          return
        }

        console.log('[OAuth Callback] Session created successfully')

        // 检查用户是否有 profile/nickname
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', data.session.user.id)
          .single()

        if (profile?.nickname) {
          console.log('[OAuth Callback] User has nickname, redirecting to home')
          router.replace('/')
        } else {
          console.log('[OAuth Callback] New user, redirecting to welcome')
          router.replace('/welcome')
        }
      } catch (error: any) {
        console.error('[OAuth Callback] Unexpected error:', error)
        router.replace(`/login?error=unexpected&details=${encodeURIComponent(error.message)}`)
      }
    }

    handleOAuth()
  }, [router, supabase, searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-rose-50 via-purple-50 to-blue-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-rose-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-lg text-slate-700 font-medium">正在登入中...</p>
        <p className="text-sm text-slate-500 mt-2">請稍候，即將為您跳轉</p>
      </div>
    </div>
  )
}
```

#### Step 4: 检查 Supabase 配置

**在 Supabase Dashboard 中验证**：

1. **Authentication → URL Configuration**
   - Site URL: `https://megan.tonetown.ai`
   - Redirect URLs: `https://megan.tonetown.ai/**`

2. **Authentication → Providers → Google**
   - Client ID: 正确配置
   - Client Secret: 正确配置
   - **启用 PKCE**: 确保已启用（默认应该启用）

3. **检查 Supabase Auth Logs**
   - 查看是否有相关错误日志
   - 检查 PKCE 相关的错误

---

### 阶段三：添加错误处理和日志

#### Step 1: 增强 API 路由的错误处理

**在 `app/api/favorites/route.ts` 和 `app/api/conversations/route.ts` 中添加**：

```typescript
export async function GET(request: Request) {
  try {
    // 添加详细的错误日志
    console.log('[API] Starting request...')
    
    const cookieStore = cookies();
    console.log('[API] Cookies retrieved:', cookieStore ? 'OK' : 'FAILED')
    
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    });
    console.log('[API] Supabase client created')
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('[API] Session error:', sessionError)
      return unauthorized();
    }
    
    if (!session) {
      console.warn('[API] No session found')
      return unauthorized();
    }
    
    // ... rest of code
  } catch (error: any) {
    // 详细的错误日志
    console.error('[API] Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      cookiesError: error?.message?.includes('cookies'),
    })
    return serverError(error?.message || 'Unknown error');
  }
}
```

#### Step 2: 添加客户端错误监控

**在 `app/page.tsx` 中添加错误边界**：

```typescript
// 在 API 调用时添加错误处理
try {
  const response = await fetch('/api/favorites', {
    credentials: 'include', // 确保 cookies 被发送
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    console.error('[Client] API Error:', {
      status: response.status,
      error: errorData,
    })
    // 显示用户友好的错误消息
  }
} catch (error) {
  console.error('[Client] Fetch Error:', error)
}
```

---

### 阶段四：测试和验证

#### 测试清单

**Cookies API 测试**：
- [ ] 本地构建测试：`npm run build && npm run start`
- [ ] 测试 `/api/favorites` GET 请求
- [ ] 测试 `/api/favorites` POST 请求
- [ ] 测试 `/api/conversations` GET 请求
- [ ] 测试 `/api/conversations` POST 请求
- [ ] 检查控制台无 cookies 错误

**OAuth 测试**：
- [ ] 清除浏览器 cookies 和 localStorage
- [ ] 使用无痕模式访问登录页面
- [ ] 点击「使用 Google 登入」
- [ ] 完成 OAuth 流程
- [ ] 验证成功跳转到首页或欢迎页
- [ ] 检查控制台无 PKCE 错误

**生产环境测试**：
- [ ] 部署到 Railway
- [ ] 等待构建完成
- [ ] 访问生产环境
- [ ] 测试所有功能
- [ ] 检查 Railway 日志
- [ ] 检查浏览器控制台

---

## 🔍 调试工具

### 1. 本地调试脚本

创建 `debug-api.js`：

```javascript
// 测试 API 端点
async function testAPI() {
  const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  console.log('🧪 Testing API endpoints...')
  
  // 测试 health check
  try {
    const health = await fetch(`${baseURL}/api/health`)
    console.log('✅ Health check:', await health.json())
  } catch (error) {
    console.error('❌ Health check failed:', error)
  }
  
  // 测试 favorites (需要认证)
  try {
    const favorites = await fetch(`${baseURL}/api/favorites`, {
      credentials: 'include',
    })
    console.log('📊 Favorites API:', favorites.status, favorites.statusText)
    if (!favorites.ok) {
      const error = await favorites.json()
      console.error('❌ Favorites error:', error)
    }
  } catch (error) {
    console.error('❌ Favorites API failed:', error)
  }
}

testAPI()
```

### 2. 浏览器调试

**在浏览器控制台中运行**：

```javascript
// 检查 cookies
console.log('Cookies:', document.cookie)

// 检查 localStorage
console.log('LocalStorage:', { ...localStorage })

// 检查 sessionStorage
console.log('SessionStorage:', { ...sessionStorage })

// 测试 API
fetch('/api/favorites', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
  .catch(console.error)
```

---

## 📝 部署检查清单

### 部署前
- [ ] 所有代码已提交到 Git
- [ ] 本地测试通过
- [ ] 没有 TypeScript 错误
- [ ] 没有 ESLint 错误
- [ ] 环境变量已配置

### 部署时
- [ ] 清除构建缓存
- [ ] 强制重新构建
- [ ] 监控构建日志
- [ ] 等待部署完成

### 部署后
- [ ] 访问生产环境
- [ ] 测试登录功能
- [ ] 测试 API 端点
- [ ] 检查控制台错误
- [ ] 检查 Railway 日志
- [ ] 验证所有功能正常

---

## 🚨 紧急回滚方案

如果部署后问题更严重：

1. **在 Railway 中回滚**：
   - 进入 Deployment History
   - 选择上一个成功的部署
   - 点击 "Redeploy"

2. **或者快速修复**：
   - 修复代码
   - 立即提交和部署
   - 使用 `--force` 标志强制部署

---

## 📞 需要帮助时提供的信息

如果问题仍然存在，请提供：

1. **浏览器控制台完整错误**（截图或复制）
2. **Network 面板中的请求详情**（特别是失败的 API 请求）
3. **Railway 部署日志**（最近的错误日志）
4. **Supabase Auth Logs**（如果有相关错误）
5. **环境信息**：
   - 浏览器类型和版本
   - 操作系统
   - 是否使用无痕模式
   - 是否清除了 cookies

---

## ✅ 预期结果

修复后应该：

- ✅ 所有 API 返回 200 OK（如果已登录）
- ✅ 控制台无 cookies 错误
- ✅ OAuth 登录流程正常
- ✅ Favorites 和 Conversations 功能正常
- ✅ Session 验证正常工作
- ✅ 无 PKCE 相关错误

---

**最后更新**：2024-12-19
**状态**：待执行






