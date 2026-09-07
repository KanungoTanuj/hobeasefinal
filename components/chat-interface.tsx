"use client"

import type React from "react"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Send, MessageSquare, AlertCircle, ChevronDown, Trash2, Check, CheckCheck, X, Wifi, WifiOff } from "lucide-react"
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
  is_read?: boolean
  read_at?: string | null
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

      // Mark unread messages from other user as read
      if (messagesData && messagesData.length > 0) {
        const unreadMessages = messagesData.filter(
          (m) => m.sender_auth_id !== currentUserId && !m.is_read,
        )
        if (unreadMessages.length > 0) {
          console.log("[v0] Marking", unreadMessages.length, "messages as read")
          const { error: updateError } = await supabase
            .from("messages")
            .update({ is_read: true, read_at: new Date().toISOString() })
            .in(
              "id",
              unreadMessages.map((m) => m.id),
            )
          if (updateError) {
            console.error("[v0] Error marking messages as read:", updateError)
          }
        }
      }
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
    if (e.nativeEvent.isComposing || e.keyCode === 229) return
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
    <Card className="flex h-[min(680px,calc(100vh-10rem))] min-h-[520px] flex-col overflow-hidden rounded-2xl border-border/70 bg-card shadow-xl shadow-black/5">
      <CardHeader className="border-b border-border/70 bg-muted/20 px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-11 shrink-0 ring-2 ring-background shadow-sm">
              <AvatarImage src={booking.teacher?.photo_url || "/placeholder.svg?height=40&width=40&query=user"} alt={`${otherParticipant.name} profile`} />
              <AvatarFallback className="bg-primary/10 font-semibold text-primary">{otherParticipant.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <CardTitle className="truncate text-base sm:text-lg">{otherParticipant.name}</CardTitle>
              <p className="mt-0.5 truncate text-xs text-muted-foreground sm:text-sm">
                {booking.teacher_skill} <span aria-hidden="true">·</span> {new Date(booking.booking_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Badge variant="secondary" className="hidden capitalize sm:inline-flex">{booking.status}</Badge>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground" aria-live="polite" title={realtimeConnected ? "Realtime connected" : "Realtime disconnected"}>
              {realtimeConnected ? <Wifi className="size-3.5 text-emerald-500" /> : <WifiOff className="size-3.5" />}
              <span className="hidden sm:inline">{realtimeConnected ? "Live" : "Offline"}</span>
            </span>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close chat" className="size-9 rounded-full">
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col p-0">
        {error && (
          <div className="mx-4 mt-4 flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-destructive sm:mx-6">
            <AlertCircle className="size-4 shrink-0" />
            <p className="min-w-0 flex-1 text-sm">{error}</p>
            <Button size="icon" variant="ghost" onClick={() => setError(null)} aria-label="Dismiss error" className="size-7 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"><X className="size-4" /></Button>
          </div>
        )}

        <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto bg-muted/5 px-4 py-5 sm:px-6">
          <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-3">
            {loading ? (
              <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Loading conversation...</div>
            ) : messages.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-6 text-center">
                <div className="max-w-xs rounded-2xl border border-dashed border-border bg-background/70 px-6 py-7 shadow-sm">
                  <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary"><MessageSquare className="size-5" /></div>
                  <p className="font-medium">Start the conversation</p>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">Send a message to {otherParticipant.name} about your upcoming session.</p>
                </div>
              </div>
            ) : (
              messages.map((message) => {
                const isCurrentUser = message.sender_auth_id === currentUserId
                return (
                  <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                    <div className={`group relative flex max-w-[88%] flex-col sm:max-w-[72%] ${isCurrentUser ? "items-end" : "items-start"}`}>
                      <div
                        className={`relative rounded-2xl px-4 py-3 shadow-sm ${isCurrentUser ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border border-border/70 bg-background text-foreground"}`}
                        onTouchStart={() => isCurrentUser && startLongPress(message.id)}
                        onTouchEnd={() => isCurrentUser && cancelLongPress(message.id)}
                        onTouchMove={() => isCurrentUser && cancelLongPress(message.id)}
                        onContextMenu={(e) => { if (!isCurrentUser) return; e.preventDefault(); setOpenMenuForId(message.id) }}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                        <div className={`mt-1.5 flex items-center justify-end gap-1 text-[11px] ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          <span>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                          {isCurrentUser && (message.is_read ? <CheckCheck className="size-3.5 text-sky-300" title="Read" /> : <Check className="size-3.5" title="Sent" />)}
                        </div>
                        {isCurrentUser && (
                          <div className="absolute -right-2 -top-2">
                            <DropdownMenu open={openMenuForId === message.id} onOpenChange={(open) => setOpenMenuForId(open ? message.id : null)}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="secondary" size="icon" className="hidden size-7 rounded-full border shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 data-[state=open]:opacity-100 md:inline-flex" aria-label="Message options" onClick={() => setOpenMenuForId(message.id)}><ChevronDown className="size-3.5" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => { if (deletingIds.has(message.id)) return; if (confirm("Delete this message?")) handleDeleteMessage(message.id); setOpenMenuForId(null) }} disabled={deletingIds.has(message.id)}><Trash2 className="mr-2 size-4" />Delete</DropdownMenuItem>
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
        </div>

        <div className="border-t border-border/70 bg-background px-4 py-3 sm:px-6 sm:py-4">
          <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-muted/30 p-1.5 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10">
            <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={handleKeyPress} placeholder="Write a message..." disabled={sending} aria-label="Message" className="h-10 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0" />
            <Button onClick={sendMessage} disabled={!newMessage.trim() || sending} size="icon" aria-label="Send message" className="size-10 shrink-0 rounded-xl"><Send className="size-4" /></Button>
          </div>
          <p className="mx-auto mt-2 hidden max-w-3xl text-[11px] text-muted-foreground sm:block">Press Enter to send <span aria-hidden="true">·</span> Shift + Enter for a new line</p>
          {error && <div className="mx-auto mt-2 max-w-3xl"><Button size="sm" variant="outline" onClick={() => fetchMessages(false)} className="text-xs">Retry loading messages</Button></div>}
        </div>
      </CardContent>
    </Card>
  )
}
