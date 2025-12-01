/**
 * Supabase Client for Browser (Client Components)
 * 
 * 用于客户端组件中创建 Supabase 客户端
 * 支持 PKCE OAuth flow
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
 * 使用默认的 sessionStorage 以确保 PKCE 流程正常工作
 * 使用单例模式，确保整个应用只有一个客户端实例
 */
export function createClient(): SupabaseClient {
  // 如果已经存在实例，直接返回（避免多个实例）
  if (clientInstance) {
    return clientInstance
  }

  // 使用 Supabase 默认的 sessionStorage
  // 这是最可靠的方式，确保 PKCE OAuth 流程正常工作
  clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // 不设置 storage，让 Supabase 使用默认的 sessionStorage
      // 这样可以确保 PKCE code_verifier 在 OAuth redirect 过程中保持可用
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  })

  return clientInstance
}
