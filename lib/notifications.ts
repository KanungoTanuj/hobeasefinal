import { createServerComponentClient } from "@/lib/supabase"

export type NotificationType = "message" | "booking" | "class" | "completion" | "system"

export async function getAuthenticatedUser() {
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) throw new Error("Authentication required")
  return { supabase, user: data.user }
}

export async function createNotification(input: {
  userAuthId: string
  type: NotificationType
  title: string
  content?: string
  relatedId?: string
}) {
  const supabase = await createServerComponentClient()
  const { error } = await supabase.from("notifications").insert({
    user_auth_id: input.userAuthId,
    type: input.type,
    title: input.title,
    content: input.content ?? null,
    related_id: input.relatedId ?? null,
  })
  if (error) throw error
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

export async function notifyUsers(userIds: string[], input: Omit<Parameters<typeof createNotification>[0], "userAuthId">) {
  await Promise.all(userIds.map((userAuthId) => createNotification({ ...input, userAuthId })))
}
