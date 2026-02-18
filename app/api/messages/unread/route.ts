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
    const supabase = createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Get all bookings for this user (as teacher or learner)
    const { data: teacherData } = await supabase.from("Teachers").select("id").eq("auth_id", user.id).single()

    const { data: learnerData } = await supabase.from("learners").select("id").eq("auth_id", user.id).single()

    let unreadCount = 0
    const unreadByBooking: { [key: string]: number } = {}

    // Get unread messages for teacher
    if (teacherData) {
      const { data: teacherMessages, error: teacherError } = await supabase
        .from("messages")
        .select("booking_id")
        .eq("is_read", false)
        .neq("sender_auth_id", user.id)
        .in(
          "booking_id",
          (
            await supabase
              .from("bookings")
              .select("id")
              .eq("teacher_id", teacherData.id)
          ).data?.map((b) => b.id) || [],
        )

      if (teacherMessages) {
        teacherMessages.forEach((msg) => {
          unreadCount++
          unreadByBooking[msg.booking_id] = (unreadByBooking[msg.booking_id] || 0) + 1
        })
      }
    }

    // Get unread messages for learner
    if (learnerData) {
      const { data: learnerMessages, error: learnerError } = await supabase
        .from("messages")
        .select("booking_id")
        .eq("is_read", false)
        .neq("sender_auth_id", user.id)
        .in(
          "booking_id",
          (
            await supabase
              .from("bookings")
              .select("id")
              .eq("learner_id", learnerData.id)
          ).data?.map((b) => b.id) || [],
        )

      if (learnerMessages) {
        learnerMessages.forEach((msg) => {
          unreadCount++
          unreadByBooking[msg.booking_id] = (unreadByBooking[msg.booking_id] || 0) + 1
        })
      }
    }

    return NextResponse.json({ unreadCount, unreadByBooking })
  } catch (error) {
    console.error("[v0] Error fetching unread messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
