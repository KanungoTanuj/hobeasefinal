import { NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    const subscription = await request.json()
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 })
    }
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_auth_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    }, { onConflict: "user_auth_id,endpoint" })
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unable to save subscription" }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await getAuthenticatedUser()
    const { endpoint } = await request.json()
    const { error } = await supabase.from("push_subscriptions").delete().eq("user_auth_id", user.id).eq("endpoint", endpoint)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Unable to remove subscription" }, { status: 500 })
  }
}
