import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json()
    if (!bookingId) return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })

    const supabase = await createServerComponentClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: teacher } = await supabase.from("Teachers").select("id").eq("auth_id", session.user.id).maybeSingle()
    if (!teacher) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 })

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status, teacher_id")
      .eq("id", bookingId)
      .eq("teacher_id", teacher.id)
      .single()
    if (bookingError || !booking) return NextResponse.json({ error: "Booking not found or unauthorized" }, { status: 404 })

    const { data: activeClass, error: classError } = await supabase
      .from("classes")
      .select("id, end_time, teacher_id")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    console.log("[v0] Teacher completion validation", {
      bookingId: booking.id,
      bookingStatus: booking.status,
      classId: activeClass?.id ?? null,
      classEndTime: activeClass?.end_time ?? null,
      teacherAuthId: activeClass?.teacher_id ?? null,
      authenticatedUserId: session.user.id,
      classLookupError: classError?.message ?? null,
    })

    const normalizedStatus = typeof booking.status === "string" ? booking.status.trim().toLowerCase() : booking.status
    if (normalizedStatus !== "awaiting_completion") return NextResponse.json({ error: "This class is not ready for completion" }, { status: 409 })

    const { error } = await supabase.rpc("confirm_booking_completion_as_teacher", { p_booking_id: bookingId })
    if (error) {
      console.error("[v0] Teacher completion RPC failed:", error)
      return NextResponse.json({ error: "Failed to confirm completion" }, { status: 500 })
    }
    return NextResponse.json({ message: "Class completion confirmed" })
  } catch (error) {
    console.error("[v0] Error confirming teacher completion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
