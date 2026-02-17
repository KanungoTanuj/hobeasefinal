import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const bookingId = searchParams.get("bookingId")

    console.log("[v0] Checking class status for bookingId:", bookingId)

    if (!bookingId) {
      return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })
    }

    const supabase = await createServerComponentClient()

    // Get the current user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    console.log("[v0] Auth check:", { hasSession: !!session, error: authError })

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if class exists for this booking
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("*")
      .eq("booking_id", bookingId)
      .is("end_time", null)
      .maybeSingle()

    console.log("[v0] Class status query result:", {
      hasClass: !!classData,
      classId: classData?.id,
      error: classError,
    })

    if (classError && classError.code !== "PGRST116") {
      console.error("[v0] Error checking class status:", classError)
      return NextResponse.json({ error: "Failed to check class status" }, { status: 500 })
    }

    if (!classData) {
      console.log("[v0] No active class found for booking:", bookingId)
      return NextResponse.json({ active: false, message: "No active class" })
    }

    console.log("[v0] Active class found:", classData.id)
    return NextResponse.json({
      active: true,
      classId: classData.id,
      roomId: classData.room_id,
      startTime: classData.start_time,
    })
  } catch (error) {
    console.error("[v0] Error checking class status:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
