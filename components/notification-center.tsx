"use client"

import { useEffect, useState } from "react"
import { Bell, Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { supabase } from "@/lib/supabase"

type Notification = { id: string; type: string; title: string; content: string | null; related_id: string | null; is_read: boolean; created_at: string }

export function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([])
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [loading, setLoading] = useState(true)

  async function load() {
    const response = await fetch("/api/notifications")
    if (response.ok) setItems((await response.json()).notifications)
    setLoading(false)
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    setPermission("Notification" in window ? Notification.permission : "unsupported")
    load()
    let channel: ReturnType<typeof supabase.channel> | undefined
    let cancelled = false
    supabase.auth.getUser().then(({ data }) => {
      if (cancelled || !data.user) return
      channel = supabase.channel(`user-notifications-${data.user.id}`).on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications", filter: `user_auth_id=eq.${data.user.id}`,
      }, load).subscribe()
    })
    return () => { cancelled = true; if (channel) supabase.removeChannel(channel) }
  }, [])

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("Notification" in window)) return
    const next = await Notification.requestPermission()
    setPermission(next)
    if (next !== "granted") return
    const registration = await navigator.serviceWorker.register("/sw.js")
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!key) return
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
    await fetch("/api/notifications/subscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(subscription) })
  }

  async function markRead(id?: string) {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(id ? { id } : {}) })
    setItems((current) => current.map((item) => id && item.id !== id ? item : { ...item, is_read: true }))
  }

  const unread = items.filter((item) => !item.is_read).length
  return <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}>
        <Bell data-icon="inline-start" />
        {unread > 0 && <Badge className="absolute -right-1 -top-1 min-w-5 justify-center px-1 text-[10px]">{unread > 99 ? "99+" : unread}</Badge>}
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" className="w-80 p-0">
      <div className="flex items-center justify-between border-b p-4"><div><h2 className="font-semibold">Notifications</h2><p className="text-xs text-muted-foreground">Updates from your Hobease activity</p></div>{unread > 0 && <Button variant="ghost" size="sm" onClick={() => markRead()}>Mark all read</Button>}</div>
      {permission === "default" && <div className="flex items-center justify-between gap-3 border-b p-3 text-xs"><span>Enable browser alerts for new updates.</span><Button size="sm" onClick={enablePush}>Enable</Button></div>}
      <div className="flex max-h-80 flex-col overflow-y-auto">
        {loading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div> : items.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">You&apos;re all caught up.</p> : items.map((item) => <button key={item.id} type="button" onClick={() => !item.is_read && markRead(item.id)} className="flex gap-3 border-b p-3 text-left hover:bg-muted/50"><span className={`mt-1 size-2 shrink-0 rounded-full ${item.is_read ? "bg-transparent" : "bg-primary"}`} /><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.title}</span>{item.content && <span className="mt-1 block text-xs text-muted-foreground">{item.content}</span>}<time className="mt-1 block text-[11px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</time></span>{item.is_read && <Check className="text-muted-foreground" />}</button>)}
      </div>
    </PopoverContent>
  </Popover>
}
