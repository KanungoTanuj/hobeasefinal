import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json()

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const supabase = await createServerComponentClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    console.log("[v0] END CLASS AUTH RESULT", {
      authenticatedUserId: user?.id ?? null,
      authError: error?.message ?? null,
    })

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const authenticatedTeacherAuthId = user.id
    console.log("[v0] /api/classes/end received", { bookingId, authenticatedTeacherAuthId })

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, teacher_auth_id, learner_auth_id, teacher_id, status")
      .eq("id", bookingId)
      .single()

    if (bookingError) {
      console.error("[v0] Booking lookup failed:", bookingError)
    }
    if (!booking) {
      console.error("[v0] Booking lookup returned zero rows", { bookingId })
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    console.log("[v0] Booking lookup succeeded", {
      bookingId: booking.id,
      bookingStatus: booking.status,
      bookingTeacherAuthId: booking.teacher_auth_id,
      bookingLearnerAuthId: booking.learner_auth_id,
      bookingTeacherId: (booking as { teacher_id?: string | null }).teacher_id ?? null,
      authenticatedUserId: user.id,
    })
    console.log("[v0] END CLASS BOOKING AUTH DEBUG", {
      bookingId,
      authenticatedUserId: user.id,
      bookingTeacherAuthId: booking.teacher_auth_id,
      bookingLearnerAuthId: booking.learner_auth_id,
      bookingTeacherId: booking.teacher_id,
      bookingStatus: booking.status,
    })

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
      .eq("booking_id", booking.id)
      .eq("id", classData.id)
      .select("id, end_time")
      .maybeSingle()

    if (classUpdateError) {
      console.error("[v0] Error updating class end time:", classUpdateError)
      return NextResponse.json({ error: classUpdateError.message }, { status: 500 })
    }

    console.log("[v0] Class update returned", { classId: classData.id, endTime: updatedClass?.end_time ?? null })
    if (!updatedClass || !updatedClass.end_time) {
      console.error("[v0] Class end-time update did not return a non-null end_time", { bookingId, classId: classData.id })
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
      return NextResponse.json({ error: bookingUpdateError.message }, { status: 500 })
    }

    console.log("[v0] Booking update returned", { bookingId, status: updatedBooking?.status ?? null })
    if (!updatedBooking || updatedBooking.status !== "awaiting_completion") {
      console.error("[v0] Booking status update did not return awaiting_completion", { bookingId, classId: classData.id })
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
