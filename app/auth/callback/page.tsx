"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/app/utils/supabase/client"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      // 使用 window.location 获取 URL 参数，避免 Suspense 问题
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get("code")
      const error = urlParams.get("error")
      const errorDescription = urlParams.get("error_description")

      // 检查是否有 OAuth 错误
      if (error) {
        console.error("[OAuth Callback] OAuth error:", error, errorDescription)
        router.replace(`/login?error=${encodeURIComponent(error)}&details=${encodeURIComponent(errorDescription || "")}`)
        return
      }

      if (!code) {
        console.error("[OAuth Callback] No code in URL")
        router.replace("/login?error=no_code")
        return
      }

      console.log("[OAuth Callback] Exchanging code for session")
      
      const supabase = createClient()
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error("[OAuth Callback] Error exchanging code:", exchangeError)
        
        // 如果是 PKCE 错误，提供更详细的诊断
        if (exchangeError.message?.includes("code verifier") || exchangeError.message?.includes("non-empty")) {
          console.error("[OAuth Callback] PKCE error detected")
          console.error("[OAuth Callback] Checking sessionStorage for code_verifier...")
          
          try {
            // 检查 sessionStorage 中是否有 code_verifier
            const storageKeys = Object.keys(sessionStorage)
            const pkceKeys = storageKeys.filter(k => k.includes("pkce") || k.includes("code-verifier"))
            console.log("[OAuth Callback] SessionStorage PKCE keys:", pkceKeys)
            
            if (pkceKeys.length === 0) {
              console.error("[OAuth Callback] No PKCE keys found in sessionStorage!")
              console.error("[OAuth Callback] This suggests the code_verifier was not stored or was cleared")
            }
          } catch (e) {
            console.warn("[OAuth Callback] Cannot access sessionStorage:", e)
          }
        }
        
        router.replace(`/login?error=exchange_failed&details=${encodeURIComponent(exchangeError.message || "Unknown error")}`)
        return
      }

      // 验证 session 是否创建成功
      if (!data.session) {
        console.warn("[OAuth Callback] No session after exchange")
        router.replace("/login?error=no_session")
        return
      }

      console.log("[OAuth Callback] Session created successfully for user:", data.session.user.id)

      // 检查用户是否有 profile/nickname
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", data.session.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("[OAuth Callback] Error fetching profile:", profileError)
        // 继续执行，即使获取 profile 失败
      }

      if (profile?.nickname) {
        console.log("[OAuth Callback] User has nickname, redirecting to home")
        router.replace("/")
      } else {
        console.log("[OAuth Callback] New user, redirecting to welcome")
        router.replace("/welcome")
      }
    }

    run()
  }, [router])

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
