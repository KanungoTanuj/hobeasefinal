"use client"

import { useEffect, useState } from "react"
import { Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UnreadBadgeProps {
  bookingId?: string
}

export function UnreadBadge({ bookingId }: UnreadBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await fetch("/api/messages/unread")
        if (response.ok) {
          const data = await response.json()
          if (bookingId && data.unreadByBooking) {
            setUnreadCount(data.unreadByBooking[bookingId] || 0)
          } else {
            setUnreadCount(data.unreadCount || 0)
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching unread count:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUnreadCount()

    // Refresh every 10 seconds
    const interval = setInterval(fetchUnreadCount, 10000)
    return () => clearInterval(interval)
  }, [bookingId])

  if (loading || unreadCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <Bell className="h-4 w-4 text-orange-500" />
      <Badge className="bg-red-500 hover:bg-red-600 text-white">{unreadCount}</Badge>
    </div>
  )
}
