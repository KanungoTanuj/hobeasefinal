import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authenticatedTeacherAuthId = session.user.id
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, teacher_auth_id, status")
      .eq("id", bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.teacher_auth_id !== authenticatedTeacherAuthId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, booking_id, end_time")
      .eq("booking_id", bookingId)
      .maybeSingle()

    if (classError) {
      console.error("[v0] Error finding class for booking:", classError)
      return NextResponse.json({ error: "Failed to find class" }, { status: 500 })
    }

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    const endTime = new Date().toISOString()
    console.log("[v0] Ending class update before:", {
      bookingId,
      classId: classData.id,
      authenticatedTeacherAuthId,
      bookingTeacherAuthId: booking.teacher_auth_id,
      currentBookingStatus: booking.status,
      classEndTimeBefore: classData.end_time,
      classEndTimeAfter: endTime,
      bookingStatusAfter: "awaiting_completion",
    })

    const { data: updatedClass, error: classUpdateError } = await supabase
      .from("classes")
      .update({ end_time: endTime })
      .eq("id", classData.id)
      .select("id, end_time")
      .maybeSingle()

    if (classUpdateError) {
      console.error("[v0] Error updating class end time:", classUpdateError)
      return NextResponse.json({ error: "Failed to end class" }, { status: 500 })
    }

    if (!updatedClass) {
      console.error("[v0] Class end-time update affected zero rows", { bookingId, classId: classData.id })
      return NextResponse.json({ error: "Failed to end class" }, { status: 500 })
    }

    const { data: updatedBooking, error: bookingUpdateError } = await supabase
      .from("bookings")
      .update({ status: "awaiting_completion", updated_at: new Date().toISOString() })
      .eq("id", bookingId)
      .eq("status", "in_progress")
      .select("status")
      .maybeSingle()

    if (bookingUpdateError) {
      console.error("[v0] Error updating booking status:", bookingUpdateError)
      return NextResponse.json({ error: "Failed to update booking status" }, { status: 500 })
    }

    if (!updatedBooking) {
      console.error("[v0] Booking status update affected zero rows", { bookingId, classId: classData.id })
      return NextResponse.json({ error: "Booking is not in progress" }, { status: 409 })
    }

    console.log("[v0] Ending class update after:", {
      bookingId,
      classId: classData.id,
      authenticatedTeacherAuthId,
      bookingTeacherAuthId: booking.teacher_auth_id,
      currentBookingStatus: booking.status,
      classEndTimeBefore: classData.end_time,
      classEndTimeAfter: updatedClass.end_time,
      bookingStatusAfter: updatedBooking.status,
    })

    return NextResponse.json({ message: "Class ended successfully", classId: classData.id, status: updatedBooking.status })
  } catch (error) {
    console.error("[v0] Error ending class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
