'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
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
        // 从 URL 获取 code 和可能的错误（使用 window.location 避免 Suspense 问题）
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')
        const errorDescription = urlParams.get('error_description')

        // 检查是否有 OAuth 错误
        if (error) {
          console.error('[OAuth Callback] OAuth error:', error, errorDescription)
          router.replace(`/login?error=${encodeURIComponent(error)}&details=${encodeURIComponent(errorDescription || '')}`)
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
          if (exchangeError.message?.includes('code verifier') || exchangeError.message?.includes('non-empty')) {
            console.error('[OAuth Callback] PKCE error detected')
            console.error('[OAuth Callback] Possible causes:')
            console.error('  1. Browser cleared localStorage/sessionStorage during redirect')
            console.error('  2. Cross-origin redirect issues')
            console.error('  3. Supabase PKCE configuration issue')
            console.error('  4. Code verifier not properly stored/retrieved')
            
            // 检查 localStorage 中是否有相关数据
            try {
              const storageKeys = Object.keys(localStorage)
              console.log('[OAuth Callback] LocalStorage keys:', storageKeys.filter(k => k.includes('supabase') || k.includes('auth')))
            } catch (e) {
              console.warn('[OAuth Callback] Cannot access localStorage:', e)
            }
          }
          
          router.replace(`/login?error=exchange_failed&details=${encodeURIComponent(exchangeError.message || 'Unknown error')}`)
          return
        }

        // 验证 session 是否创建成功
        if (!data.session) {
          console.warn('[OAuth Callback] No session after exchange')
          router.replace('/login?error=no_session')
          return
        }

        console.log('[OAuth Callback] Session created successfully for user:', data.session.user.id)

        // 检查用户是否有 profile/nickname
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', data.session.user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('[OAuth Callback] Error fetching profile:', profileError)
          // 继续执行，即使获取 profile 失败
        }

        if (profile?.nickname) {
          console.log('[OAuth Callback] User has nickname, redirecting to home')
          router.replace('/')
        } else {
          console.log('[OAuth Callback] New user, redirecting to welcome')
          router.replace('/welcome')
        }
      } catch (error: any) {
        console.error('[OAuth Callback] Unexpected error:', error)
        console.error('[OAuth Callback] Error stack:', error?.stack)
        router.replace(`/login?error=unexpected&details=${encodeURIComponent(error?.message || 'Unknown error')}`)
      }
    }

    handleOAuth()
  }, [router, supabase])

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
