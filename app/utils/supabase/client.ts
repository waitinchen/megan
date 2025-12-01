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
        if (key.includes('pkce') || key.includes('code-verifier')) {
          console.log(`[Supabase Storage] Getting PKCE key: ${key}`, value ? 'Found' : 'Not found')
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
        if (key.includes('pkce') || key.includes('code-verifier')) {
          console.log(`[Supabase Storage] Setting PKCE key: ${key}`, 'Value length:', value.length)
        }
      } catch (e) {
        console.warn('[Supabase Storage] Cannot write to sessionStorage:', e)
      }
    },
    removeItem: (key: string): void => {
      try {
        window.sessionStorage.removeItem(key)
        // 调试日志：检查 PKCE 相关键
        if (key.includes('pkce') || key.includes('code-verifier')) {
          console.log(`[Supabase Storage] Removing PKCE key: ${key}`)
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

  // 创建存储适配器
  const storageAdapter = createSessionStorageAdapter()

  // 创建客户端实例
  clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: storageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // 明确指定使用 PKCE flow
    },
  })

  return clientInstance
}

