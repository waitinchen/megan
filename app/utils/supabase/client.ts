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
 * 这个客户端会自动使用浏览器的 sessionStorage 来存储 PKCE code_verifier
 * 使用单例模式，确保整个应用只有一个客户端实例
 * 
 * 确保在 Client Component 中使用，不要在 Server Component 中使用
 */
export function createClient(): SupabaseClient {
  // 如果已经存在实例，直接返回（避免多个实例）
  if (clientInstance) {
    return clientInstance
  }

  // 使用 Supabase 的默认 sessionStorage 行为
  // 不传递 storage 参数，让 Supabase 自动使用 sessionStorage
  // 这是最可靠的方式，确保 PKCE code_verifier 正确存储
  clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // 不设置 storage，使用 Supabase 默认的 sessionStorage
      // 这样可以确保 PKCE code_verifier 在 OAuth redirect 过程中保持可用
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // 明确指定使用 PKCE flow
    },
  })
  
  // 添加全局 sessionStorage 监听器用于调试（仅在开发环境）
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    const originalSetItem = Storage.prototype.setItem
    Storage.prototype.setItem = function(key: string, value: string) {
      if (key.includes('pkce') || key.includes('code-verifier')) {
        console.log(`[Supabase Storage] SET: ${key}`, `Value length: ${value.length}`)
      }
      return originalSetItem.call(this, key, value)
    }
    
    const originalGetItem = Storage.prototype.getItem
    Storage.prototype.getItem = function(key: string) {
      const value = originalGetItem.call(this, key)
      if (key.includes('pkce') || key.includes('code-verifier')) {
        console.log(`[Supabase Storage] GET: ${key}`, value ? `Found (${value.length} chars)` : 'Not found')
      }
      return value
    }
  }

  return clientInstance
}

