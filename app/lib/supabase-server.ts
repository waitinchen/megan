/**
 * Supabase Server Client Helper
 * 用于在 Next.js 16 App Router 中正确创建 Supabase 客户端
 * 
 * 由于 @supabase/auth-helpers-nextjs 0.10.0 与 Next.js 16 不兼容，
 * 我们直接使用 @supabase/supabase-js 并手动处理 cookies
 */

import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 创建 Supabase 路由处理器客户端
 * 手动处理 cookies 以兼容 Next.js 16
 */
export async function createSupabaseRouteHandlerClient() {
  const cookieStore = await cookies();
  
  // 创建一个自定义的 cookie 处理函数
  const cookieOptions = {
    get: (name: string) => {
      const cookie = cookieStore.get(name);
      return cookie?.value || null;
    },
    set: (name: string, value: string, options: any) => {
      cookieStore.set(name, value, options);
    },
    remove: (name: string, options: any) => {
      cookieStore.delete(name);
    },
    getAll: () => {
      const allCookies = cookieStore.getAll();
      return allCookies.map(c => ({ name: c.name, value: c.value }));
    },
  };
  
  // 创建 Supabase 客户端，使用自定义的 cookie 处理
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: {
        getItem: (key: string) => {
          return cookieOptions.get(key);
        },
        setItem: (key: string, value: string) => {
          cookieOptions.set(key, value, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
          });
        },
        removeItem: (key: string) => {
          cookieOptions.remove(key, { path: '/' });
        },
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  
  return supabase;
}

