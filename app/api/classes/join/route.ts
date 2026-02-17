import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const supabase = await createServerComponentClient()

    const { bookingId } = await request.json()

    console.log("[v0] Join class request for booking:", bookingId)

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    // Get the current user (student)
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    console.log("[v0] Auth session:", session ? "Found" : "Not found", authError ? `Error: ${authError.message}` : "")

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studentAuthId = session.user.id
    console.log("[v0] Student auth ID:", studentAuthId)

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("learner_auth_id", studentAuthId)
      .single()

    console.log(
      "[v0] Booking lookup:",
      booking ? "Found" : "Not found",
      bookingError ? `Error: ${bookingError.message}` : "",
    )

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found or unauthorized" }, { status: 404 })
    }

    // Check if class exists for this booking
    const { data: existingClass, error: classError } = await supabase
      .from("classes")
      .select("*")
      .eq("booking_id", bookingId)
      .is("end_time", null)
      .single()

    console.log(
      "[v0] Class lookup:",
      existingClass ? "Found" : "Not found",
      classError ? `Error: ${classError.message}` : "",
    )

    if (!existingClass) {
      return NextResponse.json({ error: "Class has not been started by the teacher yet" }, { status: 404 })
    }

    console.log("[v0] Student ready to join class:", existingClass.id)

    return NextResponse.json({
      classId: existingClass.id,
      roomId: existingClass.room_id,
      message: "Ready to join class",
    })
  } catch (error) {
    console.error("[v0] Error joining class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
