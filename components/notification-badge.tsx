"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"

interface NotificationBadgeProps {
  className?: string
}

export function NotificationBadge({ className = "" }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetchUnreadCount()

    // Subscribe to real-time updates
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `sender_auth_id=neq.${supabase.auth.getUser().then((u) => u.data.user?.id)}`,
        },
        () => {
          fetchUnreadCount()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchUnreadCount = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Count unread messages where user is recipient
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id")
        .or(`learner_auth_id.eq.${user.id},teacher_auth_id.eq.${user.id}`)

      if (!bookings?.length) return

      const bookingIds = bookings.map((b) => b.id)

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .in("booking_id", bookingIds)
        .neq("sender_auth_id", user.id)
        .eq("is_read", false)

      setUnreadCount(count || 0)
    } catch (error) {
      console.error("Error fetching unread count:", error)
    }
  }

  if (unreadCount === 0) return null

  return (
    <div
      className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 ${className}`}
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </div>
  )
}
