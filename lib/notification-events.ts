import { createNotification, getBookingParticipants } from "@/lib/notifications"

export async function notifyNewMessage(bookingId: string, messageId: string, senderId: string, senderRole: string) {
  const participants = await getBookingParticipants(bookingId)
  const recipientAuthId = participants.find((id) => id !== senderId)
  if (!recipientAuthId) throw new Error("Could not determine message recipient")

  const notification = await createNotification({
    recipientAuthId,
    type: "message",
    title: `New message from your ${senderRole === "teacher" ? "teacher" : "learner"}`,
    body: "You have a new message in your booking chat.",
    bookingId,
    messageId,
    targetUrl: `/messages?booking_id=${bookingId}`,
    eventKey: `message:${messageId}:${recipientAuthId}`,
  })

  console.log("[v0] Message notification created", { notificationId: notification?.id, messageId, recipientAuthId })
}

export async function notifyCompletion(userId: string, title: string, content: string, bookingId?: string) {
  return createNotification({
    recipientAuthId: userId,
    type: "completion",
    title,
    body: content,
    bookingId,
    eventKey: `completion:${bookingId ?? userId}:${userId}`,
  })
}
