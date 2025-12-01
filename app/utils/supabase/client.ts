/**
 * Supabase Client for Browser (Client Components)
 * 
 * 用于客户端组件中创建 Supabase 客户端
 * 支持 PKCE OAuth flow，自动处理 sessionStorage
 * 
 * 使用单例模式避免多个 GoTrueClient 实例
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 单例客户端实例（避免多个 GoTrueClient 实例警告）
let clientInstance: SupabaseClient | null = null

/**
 * 创建自定义 sessionStorage 适配器
 * 确保 PKCE code_verifier 正确存储在 sessionStorage
 * 
 * Supabase 期望的存储接口格式：
 * - getItem(key: string): Promise<string | null> | string | null
 * - setItem(key: string, value: string): Promise<void> | void
 * - removeItem(key: string): Promise<void> | void
 */
function createSessionStorageAdapter() {
  if (typeof window === 'undefined') {
    return undefined
  }

  return {
    getItem: (key: string): string | null => {
      try {
        const value = window.sessionStorage.getItem(key)
        // 调试日志：检查 PKCE 相关键
        if (key.includes('pkce') || key.includes('code-verifier') || key.includes('auth-token')) {
          console.log(`[Supabase Storage] GET: ${key}`, value ? `Found (${value.length} chars)` : 'Not found')
        }
        return value
      } catch (e) {
        console.warn('[Supabase Storage] Cannot access sessionStorage:', e)
        return null
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        window.sessionStorage.setItem(key, value)
        // 调试日志：检查 PKCE 相关键
        if (key.includes('pkce') || key.includes('code-verifier') || key.includes('auth-token')) {
          console.log(`[Supabase Storage] SET: ${key}`, `Value length: ${value.length}`)
          // 验证存储成功
          const stored = window.sessionStorage.getItem(key)
          if (stored !== value) {
            console.error(`[Supabase Storage] Storage verification failed for ${key}`)
          }
        }
      } catch (e) {
        console.warn('[Supabase Storage] Cannot write to sessionStorage:', e)
        // 检查是否是存储空间不足
        if (e instanceof DOMException && e.code === 22) {
          console.error('[Supabase Storage] SessionStorage is full!')
        }
      }
    },
    removeItem: (key: string): void => {
      try {
        window.sessionStorage.removeItem(key)
        // 调试日志：检查 PKCE 相关键
        if (key.includes('pkce') || key.includes('code-verifier') || key.includes('auth-token')) {
          console.log(`[Supabase Storage] REMOVE: ${key}`)
        }
      } catch (e) {
        console.warn('[Supabase Storage] Cannot remove from sessionStorage:', e)
      }
    },
  }
}

/**
 * 创建 Supabase 客户端（浏览器端）
 * 
/**
 * Supabase Client for Browser (Client Components)
 * 
 * 用于客户端组件中创建 Supabase 客户端
 * 支持 PKCE OAuth flow，自动处理 sessionStorage
 * 
 * 使用单例模式避免多个 GoTrueClient 实例
 */

import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 单例客户端实例（避免多个 GoTrueClient 实例警告）
let clientInstance: SupabaseClient | null = null

/**
 * 创建 Supabase 客户端（浏览器端）
 * 
 * 这个客户端会自动使用浏览器的 sessionStorage 来存储 PKCE code_verifier
 * 使用单例模式，确保整个应用只有一个客户端实例
 * 
 * 确保在 Client Component 中使用，不要在 Server Component 中使用
 */
/**
 * Create hybrid storage adapter
 * - PKCE code_verifier: sessionStorage (OAuth flow only, doesn't need server access)
 * - Session token: cookies (needs to be sent to server APIs)
 */
function createHybridStorage() {
  const cookieStorage = {
    getItem: (key: string): string | null => {
      if (typeof document === 'undefined') return null;
      const matches = document.cookie.match(new RegExp(
        '(?:^|; )' + key.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'
      ));
      return matches ? decodeURIComponent(matches[1]) : null;
    },
    setItem: (key: string, value: string): void => {
      if (typeof document === 'undefined') return;
      const maxAge = 60 * 60 * 24 * 365; // 1 year
      document.cookie = `${key}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    },
    removeItem: (key: string): void => {
      if (typeof document === 'undefined') return;
      document.cookie = `${key}=; path=/; max-age=0`;
    },
  };

  const sessionStorageAdapter = {
    getItem: (key: string): string | null => {
      if (typeof window === 'undefined') return null;
      return window.sessionStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
      if (typeof window === 'undefined') return;
      window.sessionStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
      if (typeof window === 'undefined') return;
      window.sessionStorage.removeItem(key);
    },
  };

  // Hybrid storage: PKCE in sessionStorage, session token in cookies
  return {
    getItem: (key: string): string | null => {
      // PKCE code_verifier must use sessionStorage
      if (key.includes('code-verifier') || key.includes('-code-verifier')) {
        return sessionStorageAdapter.getItem(key);
      }
      // Session token uses cookies for server access
      return cookieStorage.getItem(key);
    },
    setItem: (key: string, value: string): void => {
      // PKCE code_verifier must use sessionStorage
      if (key.includes('code-verifier') || key.includes('-code-verifier')) {
        sessionStorageAdapter.setItem(key, value);
        return;
      }
      // Session token uses cookies for server access
      cookieStorage.setItem(key, value);
    },
    removeItem: (key: string): void => {
      // Try both storages
      if (key.includes('code-verifier') || key.includes('-code-verifier')) {
        sessionStorageAdapter.removeItem(key);
      } else {
        cookieStorage.removeItem(key);
      }
    },
  };
}

export function createClient(): SupabaseClient {
  // 如果已经存在实例，直接返回（避免多个实例）
  if (clientInstance) {
    return clientInstance
  }

  // 使用混合 storage 策略:
  // - PKCE code_verifier: sessionStorage (OAuth 流程需要)
  // - Session token: cookies (API 調用需要)
  clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: createHybridStorage(),
      storageKey: 'sb-tqummhyhohacbkmpsgae-auth-token',
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })

  // 添加全局 sessionStorage 监听器用于调试（仅在开发环境）
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key.includes('pkce') || key.includes('code-verifier')) {
        console.log(`[Supabase Storage] SET: ${key}`, `Value length: ${value.length}`)
      }
      return originalSetItem.call(this, key, value)
    }

    const originalGetItem = Storage.prototype.getItem
    Storage.prototype.getItem = function (key: string) {
      const value = originalGetItem.call(this, key)
      if (key.includes('pkce') || key.includes('code-verifier')) {
        console.log(`[Supabase Storage] GET: ${key}`, value ? `Found (${value.length} chars)` : 'Not found')
      }
      return value
    }
  }

  return clientInstance
}
