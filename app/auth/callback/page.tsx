"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession()

      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const urlParams = new URLSearchParams(window.location.search)
      const accessToken = hashParams.get("access_token")
      const refreshToken = hashParams.get("refresh_token")
      const type = urlParams.get("type")

      if (error) {
        console.error("Auth callback error:", error)
        router.push("/?error=auth_error")
      } else if (data.session || (accessToken && refreshToken)) {
        if (type === "signup") {
          router.push("/?success=welcome_verified")
        } else {
          router.push("/?success=auth_success")
        }
      } else {
        if (type === "signup") {
          // Try to refresh the session after email verification
          const { data: refreshedData, error: refreshError } = await supabase.auth.refreshSession()

          if (refreshedData.session && !refreshError) {
            router.push("/?success=welcome_verified")
          } else {
            // Email verified but session expired, show success message
            router.push("/?success=email_verified_please_signin")
          }
        } else {
          router.push("/")
        }
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6600] mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
