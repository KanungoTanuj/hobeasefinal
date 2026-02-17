import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function createServerSupabaseClient() {
  return createClient(
    "https://lnmugogqdzswirtdzshx.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxubXVnb2dxZHpzd2lydGR6c2h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMTcyOTgsImV4cCI6MjA3MTY5MzI5OH0.M8JcyktEmusFtCmLmRabMZcR4IrDn1BK6CMroWn2tBI",
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("booking_id")

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    console.log("[v0] Attempting to get user from server-side Supabase client")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] Auth result:", { user: user?.id, error: authError?.message })

    if (authError || !user) {
      console.log("[v0] Authentication failed, returning 401")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("[v0] User authenticated, fetching messages for booking:", bookingId)
    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching messages:", error)
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    console.log("[v0] Successfully fetched", messages?.length || 0, "messages")
    return NextResponse.json({ messages })
  } catch (error) {
    console.error("[v0] Error in messages GET:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { booking_id, sender_role, content } = body

    if (!booking_id || !sender_role || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["learner", "teacher"].includes(sender_role)) {
      return NextResponse.json({ error: "Invalid sender role" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    console.log("[v0] POST: Attempting to get user from server-side Supabase client")
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log("[v0] POST Auth result:", { user: user?.id, error: authError?.message })

    if (authError || !user) {
      console.log("[v0] POST: Authentication failed, returning 401")
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    console.log("[v0] POST: User authenticated, creating message")
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        booking_id,
        sender_auth_id: user.id, // Use auth.uid() directly
        sender_role,
        content,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating message:", error)
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    console.log("[v0] POST: Successfully created message")
    return NextResponse.json({ message })
  } catch (error) {
    console.error("[v0] Error in messages POST:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
