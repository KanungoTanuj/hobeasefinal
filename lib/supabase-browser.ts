import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lnmugogqdzswirtdzshx.supabase.co"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubXVnb2dxZHpzd2lydGR6c2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTcyOTgsImV4cCI6MjA3MTY5MzI5OH0.M8JcyktEmusFtCmLmRabMZcR4IrDn1BK6CMroWn2tBI"

export const supabaseBrowser = createBrowserClient(supabaseUrl, supabaseAnonKey)

export default supabaseBrowser
