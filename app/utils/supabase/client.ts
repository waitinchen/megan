/**
 * Supabase Client for Browser (Client Components)
 * 
 * 使用 @supabase/ssr 确保客户端和服务端共享 session
 * 支持 PKCE OAuth flow
 */

import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
