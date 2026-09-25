import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json()
    if (!bookingId) return NextResponse.json({ error: "Booking ID is required" }, { status: 400 })

    const supabase = await createServerComponentClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: learner } = await supabase.from("learners").select("id").eq("auth_id", session.user.id).maybeSingle()
    if (!learner) return NextResponse.json({ error: "Learner profile not found" }, { status: 404 })

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, status")
      .eq("id", bookingId)
      .eq("learner_id", learner.id)
      .single()
    if (bookingError || !booking) return NextResponse.json({ error: "Booking not found or unauthorized" }, { status: 404 })
    if (booking.status !== "awaiting_completion") return NextResponse.json({ error: "This class is not ready for completion" }, { status: 409 })

    const { error } = await supabase.from("bookings").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", bookingId)
    if (error) return NextResponse.json({ error: "Failed to confirm completion" }, { status: 500 })
    return NextResponse.json({ message: "Class marked as completed" })
  } catch (error) {
    console.error("[v0] Error confirming completion:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const dynamic = "force-dynamic"
