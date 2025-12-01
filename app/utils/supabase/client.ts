/**
 * Supabase Client for Browser (Client Components)
 * 
 * 使用 @supabase/ssr 确保客户端和服务端共享 session
 * 支持 PKCE OAuth flow
 * 
 * 重要: 必须使用 cookies 存储 session,这样服务端 API 才能访问
 */

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name) {
        // 从 document.cookie 读取
        if (typeof document === 'undefined') return null
        const matches = document.cookie.match(
          new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
        )
        return matches ? decodeURIComponent(matches[1]) : null
      },
      set(name, value, options) {
        // 写入 document.cookie
        if (typeof document === 'undefined') return

        let cookie = `${name}=${encodeURIComponent(value)}`

        if (options?.maxAge) {
          cookie += `; max-age=${options.maxAge}`
        }
        if (options?.path) {
          cookie += `; path=${options.path}`
        }
        if (options?.domain) {
          cookie += `; domain=${options.domain}`
        }
        if (options?.sameSite) {
          cookie += `; samesite=${options.sameSite}`
        }
        if (options?.secure) {
          cookie += '; secure'
        }

        document.cookie = cookie
      },
      remove(name, options) {
        // 删除 cookie
        this.set(name, '', { ...options, maxAge: 0 })
      },
    },
  })
}
