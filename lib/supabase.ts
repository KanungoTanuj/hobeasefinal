import { createBrowserClient } from "@supabase/ssr"
import { createServerClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lnmugogqdzswirtdzshx.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubXVnb2dxZHpzd2lydGR6c2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTcyOTgsImV4cCI6MjA3MTY5MzI5OH0.M8JcyktEmusFtCmLmRabMZcR4IrDn1BK6CMroWn2tBI"

export function createClientComponentClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Import cookies dynamically inside the function to avoid build errors
export async function createServerComponentClient() {
  const { cookies } = await import("next/headers")
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // Handle cookie setting errors in middleware/server components
          console.error("[v0] Error setting cookies:", error)
        }
      },
    },
  })
}

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
