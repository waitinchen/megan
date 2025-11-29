'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function handleOAuth() {
      try {
        // Exchange code from URL for session
        const code = new URL(window.location.href).searchParams.get('code')

        if (code) {
          console.log('[OAuth Callback] Exchanging code for session')
          const { error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('[OAuth Callback] Error exchanging code:', error)
            router.replace('/login?error=exchange_failed')
            return
          }
        }

        // Get the session after exchange
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error('[OAuth Callback] Error getting session:', error)
          router.replace('/login?error=session_error')
          return
        }

        console.log('[OAuth Callback] Session data:', data.session ? 'Session exists' : 'No session')

        if (data.session) {
          // Check if user has a profile/nickname
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname')
            .eq('id', data.session.user.id)
            .single()

          if (profile?.nickname) {
            // Has nickname → go to dashboard
            console.log('[OAuth Callback] User has nickname, redirecting to home')
            router.replace('/')
          } else {
            // No nickname → go to welcome page
            console.log('[OAuth Callback] New user, redirecting to welcome')
            router.replace('/welcome')
          }
        } else {
          console.warn('[OAuth Callback] No session found, redirecting to login')
          router.replace('/login')
        }
      } catch (error) {
        console.error('[OAuth Callback] Unexpected error:', error)
        router.replace('/login?error=unexpected')
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
