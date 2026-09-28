self.addEventListener("push", (event) => {
  if (!event.data) return
  const data = event.data.json()
  event.waitUntil(self.registration.showNotification(data.title || "Hobease", {
    body: data.body || data.content || "You have a new notification.",
    icon: "/icon.png",
    badge: "/icon-light-32x32.png",
    data: { url: data.url || "/" },
  }))
})

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  event.waitUntil(clients.openWindow(event.notification.data?.url || "/"))
})
