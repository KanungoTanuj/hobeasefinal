"use client"

import { useEffect, useState } from "react"
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, PhoneOff, ShieldCheck, Users } from "lucide-react"

interface VideoCallInterfaceProps {
  roomId: string
  classId: string
  userName: string
  userRole: "teacher" | "learner"
  onEndCall: () => void
  isOpen: boolean
  onClose: () => void
}

function ClassroomStage({ userRole, onEndCall }: { userRole: "teacher" | "learner"; onEndCall: () => void }) {
  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }])
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"><ShieldCheck className="size-4" /></span>
          <div><p className="text-sm font-medium">Live classroom</p><p className="text-xs text-muted-foreground">{userRole === "teacher" ? "You are teaching" : "You are learning"}</p></div>
        </div>
        <Button variant="destructive" size="sm" onClick={onEndCall}><PhoneOff data-icon="inline-start" /> Leave class</Button>
      </div>
      <div className="min-h-0 flex-1 p-3 md:p-5">
        <GridLayout tracks={tracks} className="h-full gap-3">
          <ParticipantTile />
        </GridLayout>
      </div>
      <div className="border-t px-3 py-3"><ControlBar variation="minimal" /></div>
      <RoomAudioRenderer />
    </div>
  )
}

export function VideoCallInterface({ roomId, classId, userName, userRole, onEndCall, isOpen, onClose }: VideoCallInterfaceProps) {
  const [token, setToken] = useState<string>()
  const [serverUrl, setServerUrl] = useState<string>()
  const [error, setError] = useState<string>()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !classId) return
    let cancelled = false
    setLoading(true); setError(undefined); setToken(undefined)
    fetch("/api/video/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId, roomId, userName }) })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to connect"); return data })
      .then((data) => { if (!cancelled) { setToken(data.token); setServerUrl(data.url) } })
      .catch((cause) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to connect") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [classId, isOpen, roomId, userName])

  const handleLeave = async () => {
    if (userRole === "teacher") await fetch("/api/classes/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId }) })
    onEndCall(); onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[min(92vh,860px)] w-[min(96vw,1200px)] max-w-none overflow-hidden p-0">
        <DialogTitle className="sr-only">Hobease live classroom</DialogTitle>
        {loading && <div className="flex h-full items-center justify-center"><div className="flex flex-col items-center gap-3 text-center"><Loader2 className="size-8 animate-spin text-primary" /><p className="font-medium">Preparing your classroom</p><p className="text-sm text-muted-foreground">Checking your class access and devices.</p></div></div>}
        {error && <div className="flex h-full items-center justify-center p-6"><Alert variant="destructive" className="max-w-md"><AlertTitle>Could not join classroom</AlertTitle><AlertDescription className="mt-2 flex flex-col gap-4"><span>{error}</span><Button variant="outline" onClick={() => onClose()}>Close</Button></AlertDescription></Alert></div>}
        {!loading && !error && token && serverUrl && <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video options={{ adaptiveStream: true, dynacast: true }} onDisconnected={onClose} className="h-full"><ClassroomStage userRole={userRole} onEndCall={handleLeave} /></LiveKitRoom>}
        {!loading && !error && !token && <div className="flex h-full items-center justify-center"><Card className="max-w-sm"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-5" /> Classroom unavailable</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">This class is not ready to accept participants yet.</p></CardContent></Card></div>}
      </DialogContent>
    </Dialog>
  )
}
