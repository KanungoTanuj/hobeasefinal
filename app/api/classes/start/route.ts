import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json()
    console.log("[v0] Starting class for bookingId:", bookingId)

    if (!bookingId) {
      console.error("[v0] No booking ID provided")
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const supabase = await createServerComponentClient()

    // Get the current user (teacher)
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      console.error("[v0] Auth error:", authError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const teacherAuthId = session.user.id
    console.log("[v0] Teacher auth ID:", teacherAuthId)

    const { data: teacherRecord, error: teacherError } = await supabase
      .from("Teachers")
      .select("id")
      .eq("auth_id", teacherAuthId)
      .maybeSingle()

    console.log("[v0] Teacher record lookup:", { data: teacherRecord, error: teacherError })

    if (teacherError || !teacherRecord) {
      console.error("[v0] Teacher not found for auth_id:", teacherAuthId)
      return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })
    }

    const teacherId = teacherRecord.id
    console.log("[v0] Teacher ID from Teachers table:", teacherId)

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .eq("teacher_id", teacherId)
      .single()

    console.log("[v0] Booking lookup:", { data: booking, error: bookingError })

    if (bookingError || !booking) {
      console.error("[v0] Booking not found or unauthorized for teacher_id:", teacherId)
      return NextResponse.json({ error: "Booking not found or unauthorized" }, { status: 404 })
    }

    if (!booking || !["confirmed", "in_progress"].includes(booking.status)) {
      return NextResponse.json({ error: "Booking must be confirmed before starting" }, { status: 409 })
    }

    const { data: learner, error: learnerError } = await supabase
      .from("learners")
      .select("id, auth_id")
      .eq("id", booking.learner_id)
      .maybeSingle()

    if (learnerError || !learner) {
      return NextResponse.json({ error: "Learner account not found" }, { status: 404 })
    }

    // Check if class already exists for this booking
    const { data: existingClass, error: existingError } = await supabase
      .from("classes")
      .select("*")
      .eq("booking_id", bookingId)
      .is("end_time", null)
      .maybeSingle()

    console.log("[v0] Existing class check:", { data: existingClass, error: existingError })

    if (existingClass) {
      console.log("[v0] Class already exists, returning existing class")
      return NextResponse.json({
        classId: existingClass.id,
        roomId: existingClass.room_id,
        message: "Class already started",
      })
    }

    // Generate unique room ID
    const roomId = `${booking.teacher_name.replace(/\s+/g, "-")}-${booking.learner_name.replace(/\s+/g, "-")}-${Date.now()}`
    console.log("[v0] Generated room ID:", roomId)

    // Create new class
    const classData = {
      teacher_id: booking.teacher_id,
      student_id: booking.learner_id,
      booking_id: booking.id,
      room_id: roomId,
      start_time: new Date().toISOString(),
    }

    console.log("[v0] Class insert diagnostics:", {
      bookingId: booking.id,
      bookingLearnerId: booking.learner_id,
      bookingTeacherId: booking.teacher_id,
      studentIdBeingInserted: classData.student_id,
      teacherIdBeingInserted: classData.teacher_id,
    })

    const { data: newClass, error: classError } = await supabase.from("classes").insert([classData]).select().single()

    console.log("[v0] Class creation result:", { data: newClass, error: classError })

    if (classError || !newClass) {
      console.error("[v0] Error creating class:", classError)
      return NextResponse.json(
        { error: "Failed to create class: " + (classError?.message || "Unknown error") },
        { status: 500 },
      )
    }

    await supabase.from("bookings").update({ status: "in_progress", updated_at: new Date().toISOString() }).eq("id", bookingId)

    console.log("[v0] Class started successfully:", newClass.id)
    return NextResponse.json({
      classId: newClass.id,
      roomId: newClass.room_id,
      message: "Class started successfully",
    })
  } catch (error) {
    console.error("[v0] Error starting class:", error)
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : "Unknown") },
      { status: 500 },
    )
  }
}
