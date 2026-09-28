import { createNotification, getBookingParticipants, notifyUsers } from "@/lib/notifications"

export async function notifyNewMessage(bookingId: string, senderId: string, senderRole: string) {
  const participants = await getBookingParticipants(bookingId)
  const recipients = participants.filter((id) => id !== senderId)
  await notifyUsers(recipients, { type: "message", title: `New message from your ${senderRole === "teacher" ? "teacher" : "learner"}`, content: "You have a new message in your booking chat.", relatedId: bookingId })
}

export async function notifyBookingUpdate(bookingId: string, title: string, content: string) {
  await notifyUsers(await getBookingParticipants(bookingId), { type: "booking", title, content, relatedId: bookingId })
}

export async function notifyCompletion(userId: string, title: string, content: string, bookingId?: string) {
  await createNotification({ userAuthId: userId, type: "completion", title, content, relatedId: bookingId })
}
