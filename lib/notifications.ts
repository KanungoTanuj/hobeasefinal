import { createClient } from "@supabase/supabase-js"
import { createServerComponentClient } from "@/lib/supabase"

export type NotificationType = "message" | "booking" | "class" | "completion" | "system"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lnmugogqdzswirtdzshx.supabase.co"
export async function getAuthenticatedUser() {
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error("Authentication required")
  return { supabase, user: data.user }
}

function createTrustedNotificationClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for notification creation")
  }
  return createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function createNotification(input: {
  recipientAuthId: string
  type: NotificationType
  title: string
  body: string
  bookingId?: string
  messageId?: string
  targetUrl?: string
  eventKey: string
  metadata?: Record<string, unknown>
}) {
  const supabase = createTrustedNotificationClient()
  const { data, error } = await supabase
    .from("notifications")
    .upsert(
      {
        recipient_auth_id: input.recipientAuthId,
        type: input.type,
        title: input.title,
        body: input.body,
        booking_id: input.bookingId ?? null,
        message_id: input.messageId ?? null,
        target_url: input.targetUrl ?? null,
        event_key: input.eventKey,
        metadata: input.metadata ?? {},
      },
      { onConflict: "event_key", ignoreDuplicates: true },
    )
    .select("id")
    .maybeSingle()
  if (error) throw error
  return data
}

export async function getBookingParticipants(bookingId: string) {
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase
    .from("bookings")
    .select("learner_auth_id, teacher_auth_id")
    .eq("id", bookingId)
    .single()
  if (error) throw error
  return [data.learner_auth_id, data.teacher_auth_id].filter(Boolean) as string[]
}
