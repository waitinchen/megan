/**
 * Supabase Client for Browser (Client Components)
 * 
 * 使用 @supabase/ssr 的默认配置
 * 自动处理 cookies 和 session 存储
 */

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  // 使用默认配置,@supabase/ssr 会自动处理 cookies
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
