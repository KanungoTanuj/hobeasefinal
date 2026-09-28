import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/notifications"

export async function GET() {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    const { data, error } = await supabase
      .from("notifications")
      .select("id, recipient_auth_id, type, title, body, is_read, created_at, read_at, booking_id, class_id, message_id, rating_id, target_url, event_key, metadata")
      .eq("recipient_auth_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
    if (error) throw error
    return NextResponse.json({ notifications: data ?? [] })
  } catch {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    const body = await request.json().catch(() => ({}))
    const query = supabase
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("recipient_auth_id", user.id)
    const { error } = body.id ? await query.eq("id", body.id) : await query.eq("is_read", false)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unable to update notifications" }, { status: 500 })
  }
}
