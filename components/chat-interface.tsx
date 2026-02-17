"use client"

import type React from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, MessageSquare, AlertCircle, ChevronDown, Trash2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Message {
  id: string
  booking_id: string
  sender_id: string
  sender_auth_id: string
  sender_role: "learner" | "teacher"
  content: string
  created_at: string
}

interface Booking {
  id: string
  learner_name: string
  learner_email: string
  teacher_name: string
  teacher_skill: string
  booking_date: string
  booking_time: string
  status: string
  teacher?: {
    photo_url?: string
  }
}

interface ChatInterfaceProps {
  booking: Booking
  currentUserId: string
  currentUserRole: "learner" | "teacher"
  currentUserEmail: string // Add user email prop
  onClose?: () => void
}

export function ChatInterface({
  booking,
  currentUserId,
  currentUserRole,
  currentUserEmail,
  onClose,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const [realtimeConnected, setRealtimeConnected] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const didInitialScrollRef = useRef(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const [openMenuForId, setOpenMenuForId] = useState<string | null>(null)
  const longPressTimerRef = useRef<Record<string, number | null>>({})

  const scrollToBottom = (force = false) => {
    const el = listRef.current
    if (!el) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      return
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    const nearBottom = distanceFromBottom < 120
    if (force || nearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }

  const startLongPress = (id: string) => {
    // cancel any existing timer for this id
    const t = longPressTimerRef.current[id]
    if (t) clearTimeout(t as any)
    longPressTimerRef.current[id] = window.setTimeout(() => {
      setOpenMenuForId(id)
      try {
        // subtle haptic on supported devices
        // @ts-ignore
        if (navigator?.vibrate) navigator.vibrate(10)
      } catch {}
    }, 500)
  }

  const cancelLongPress = (id: string) => {
    const t = longPressTimerRef.current[id]
    if (t) {
      clearTimeout(t as any)
      longPressTimerRef.current[id] = null
    }
  }

  useEffect(() => {
    fetchMessages(false) // initial load should show loader
  }, [booking.id])

  useEffect(() => {
    if (!didInitialScrollRef.current) {
      scrollToBottom(true)
      didInitialScrollRef.current = true
    } else {
      scrollToBottom(false)
    }
  }, [messages])

  useEffect(() => {
    if (!booking?.id) return

    // Clean up any prior channel before creating a new one
    if (channelRef.current) {
      try {
        supabase.removeChannel(channelRef.current)
      } catch (e) {
        console.log("[v0] cleanup previous channel error:", e)
      }
      channelRef.current = null
    }

    const channel = supabase
      .channel(`chat-booking-${booking.id}`, {
        config: {
          broadcast: { self: false },
          presence: { key: currentUserId || "anon" },
        },
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `booking_id=eq.${booking.id}` },
        (payload) => {
          try {
            console.log("[v0] postgres_changes payload:", payload.eventType, payload.new?.id || payload.old?.id)
            if (payload.eventType === "INSERT" && payload.new) {
              const newMsg = payload.new as any
              setMessages((prev) => {
                if (!newMsg?.id) return prev
                if (prev.some((m) => m.id === newMsg.id)) return prev
                const next = [...prev, newMsg].sort(
                  (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
                )
                return next
              })
            } else if (payload.eventType === "UPDATE" && payload.new) {
              const updated = payload.new as any
              setMessages((prev) =>
                prev
                  .map((m) => (m.id === updated.id ? ({ ...m, ...updated } as Message) : m))
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
              )
            } else if (payload.eventType === "DELETE" && payload.old) {
              const removed = payload.old as any
              setMessages((prev) => prev.filter((m) => m.id !== removed.id))
            }
          } catch (err) {
            console.log("[v0] postgres_changes handler error:", (err as Error).message)
          }
        },
      )
      .on("broadcast", { event: "new-message" }, ({ payload }) => {
        const newMsg = payload as any
        console.log("[v0] broadcast new-message received:", newMsg?.id)
        setMessages((prev) => {
          if (!newMsg?.id) return prev
          if (prev.some((m) => m.id === newMsg.id)) return prev
          const next = [...prev, newMsg].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          )
          return next
        })
      })
      .on("broadcast", { event: "delete-message" }, ({ payload }) => {
        const { id } = (payload as any) || {}
        if (!id) return
        console.log("[v0] broadcast delete-message received:", id)
        setMessages((prev) => prev.filter((m) => m.id !== id))
      })

    channel
      .subscribe((status) => {
        console.log("[v0] Realtime channel status:", status)
        setRealtimeConnected(status === "SUBSCRIBED")
      })
      .catch?.((e: unknown) => {
        console.log("[v0] Realtime subscribe error:", e)
        setRealtimeConnected(false)
      })

    channelRef.current = channel

    return () => {
      try {
        supabase.removeChannel(channel)
      } catch (e) {
        console.log("[v0] removeChannel error:", e)
      }
      channelRef.current = null
      setRealtimeConnected(false)
    }
  }, [booking?.id, currentUserId])

  useEffect(() => {
    // clear any existing interval
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }

    // Always poll as a safety net (every 4s). This complements Realtime & Broadcast.
    pollingRef.current = setInterval(() => {
      console.log("[v0] Polling heartbeat - refreshing messages")
      fetchMessages(true) // silent refresh to avoid spinner flicker
    }, 4000)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
    // Only depends on booking.id so a new chat starts a fresh loop
  }, [booking?.id])

  const fetchMessages = async (silent: boolean) => {
    try {
      if (!silent) setLoading(true)
      setError(null)

      console.log("[v0] Fetching messages for booking:", booking.id)

      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", booking.id)
        .order("created_at", { ascending: true })

      if (messagesError) {
        console.error("[v0] Error fetching messages:", messagesError)
        setError("Failed to load messages. Please try again.")
        return
      }

      console.log("[v0] Messages fetched successfully:", messagesData?.length || 0)
      setMessages(messagesData || [])
    } catch (error) {
      console.error("[v0] Error fetching messages:", error)
      setError("Failed to load messages. Please check your connection.")
    } finally {
      if (!silent) setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return

    try {
      setSending(true)
      setError(null)

      console.log("[v0] Sending message for booking:", booking.id)

      // Since all other client-side operations work, we can use the passed currentUserId
      if (!currentUserId) {
        console.error("[v0] No current user ID available")
        setError("Please refresh the page and try again.")
        return
      }

      let senderId: string
      if (currentUserRole === "learner") {
        // For learners, we need to get the learner_id from the booking
        const { data: learnerData, error: learnerError } = await supabase
          .from("learners")
          .select("id")
          .eq("auth_id", currentUserId)
          .single()

        if (learnerError || !learnerData) {
          console.error("[v0] Error getting learner ID:", learnerError)
          setError("Failed to send message. Please try again.")
          return
        }
        senderId = learnerData.id
      } else {
        // For teachers, we need to get the teacher_id from the booking
        const { data: teacherData, error: teacherError } = await supabase
          .from("Teachers")
          .select("id")
          .eq("auth_id", currentUserId)
          .single()

        if (teacherError || !teacherData) {
          console.error("[v0] Error getting teacher ID:", teacherError)
          setError("Failed to send message. Please try again.")
          return
        }
        senderId = teacherData.id
      }

      const messageData = {
        booking_id: booking.id,
        sender_id: senderId, // Use the correct learner/teacher table ID
        sender_auth_id: currentUserId, // Keep auth_id for RLS policy
        sender_role: currentUserRole,
        content: newMessage.trim(),
      }

      console.log("[v0] Message data to insert:", messageData)

      const { data: newMessageData, error: insertError } = await supabase
        .from("messages")
        .insert([messageData])
        .select()
        .single()

      if (insertError) {
        console.error("[v0] Error inserting message:", insertError)
        setError("Failed to send message. Please try again.")
        return
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessageData.id)) return prev
        const next = [...prev, newMessageData].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
        return next
      })

      // Broadcast so the other client receives it even if DB replication isn't enabled
      try {
        if (channelRef.current) {
          const ack = await channelRef.current.send({
            type: "broadcast",
            event: "new-message",
            payload: newMessageData,
          })
          console.log("[v0] Broadcast ack:", ack?.status || "ok")
        } else {
          console.log("[v0] No channel to broadcast on")
        }
      } catch (e) {
        console.log("[v0] Broadcast error:", e)
      }

      setNewMessage("")
    } catch (error) {
      console.error("[v0] Error sending message:", error)
      setError("Failed to send message. Please check your connection.")
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleDeleteMessage = async (id: string) => {
    if (!id || deletingIds.has(id)) return
    const prevSnapshot = [...messages]
    setDeletingIds((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    // optimistic remove
    setMessages((prev) => prev.filter((m) => m.id !== id))
    try {
      const { error } = await supabase.from("messages").delete().eq("id", id)
      if (error) throw error
      // inform peer quickly even if DB realtime replication is delayed
      try {
        if (channelRef.current) {
          await channelRef.current.send({
            type: "broadcast",
            event: "delete-message",
            payload: { id },
          })
        }
      } catch (e) {
        console.log("[v0] broadcast delete-message error:", e)
      }
    } catch (err) {
      console.error("[v0] Delete message failed:", err)
      // revert optimistic change
      setMessages(prevSnapshot)
      setError("Failed to delete message. Please try again.")
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const otherParticipant =
    currentUserRole === "learner"
      ? { name: booking.teacher_name, role: "teacher" }
      : { name: booking.learner_name, role: "learner" }

  return (
    <Card className="h-[600px] min-h-0 flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={booking.teacher?.photo_url || "/placeholder.svg?height=40&width=40&query=user"} />
              <AvatarFallback>{otherParticipant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">{otherParticipant.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {booking.teacher_skill} • {new Date(booking.booking_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="capitalize">
              {booking.status}
            </Badge>
            <span
              className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
              aria-live="polite"
              aria-atomic="true"
              title={realtimeConnected ? "Realtime connected" : "Realtime disconnected"}
            >
              <span className={`mr-1 h-2 w-2 rounded-full ${realtimeConnected ? "bg-green-500" : "bg-zinc-400"}`} />
              {realtimeConnected ? "Live" : "Offline"}
            </span>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 min-h-0 flex flex-col p-0">
        {error && (
          <div className="mx-4 mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </Button>
          </div>
        )}

        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No messages yet</p>
                <p className="text-sm text-muted-foreground">Start the conversation!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isCurrentUser = message.sender_auth_id === currentUserId
              return (
                <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                  <div className="relative group">
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        isCurrentUser ? "bg-[#FF6600] text-white" : "bg-muted text-foreground"
                      }`}
                      // Mobile: long-press anywhere on the bubble to open the menu
                      onTouchStart={() => isCurrentUser && startLongPress(message.id)}
                      onTouchEnd={() => isCurrentUser && cancelLongPress(message.id)}
                      onTouchMove={() => isCurrentUser && cancelLongPress(message.id)}
                      // Desktop: right-click also opens menu
                      onContextMenu={(e) => {
                        if (!isCurrentUser) return
                        e.preventDefault()
                        setOpenMenuForId(message.id)
                      }}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${isCurrentUser ? "text-orange-100" : "text-muted-foreground"}`}>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {isCurrentUser && (
                        <div className="absolute top-1 right-1">
                          <DropdownMenu
                            open={openMenuForId === message.id}
                            onOpenChange={(open) => setOpenMenuForId(open ? message.id : null)}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:inline-flex h-6 w-6 rounded-full p-0 
                                           bg-background/60 hover:bg-background
                                           opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 
                                           data-[state=open]:opacity-100 focus:opacity-100 
                                           transition-opacity duration-150"
                                aria-label="Message options"
                                onClick={() => setOpenMenuForId(message.id)}
                              >
                                <ChevronDown className="h-3.5 w-3.5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-700"
                                onClick={() => {
                                  if (deletingIds.has(message.id)) return
                                  const ok = confirm("Delete this message?")
                                  if (ok) handleDeleteMessage(message.id)
                                  setOpenMenuForId(null)
                                }}
                                disabled={deletingIds.has(message.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t p-4">
          <div className="flex space-x-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!newMessage.trim() || sending}
              size="sm"
              className="bg-[#FF6600] hover:bg-[#FF6600]/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {error && (
            <div className="mt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => fetchMessages(false)}
                className="text-xs bg-transparent"
              >
                Retry Loading Messages
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
