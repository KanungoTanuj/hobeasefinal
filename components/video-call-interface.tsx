"use client"

import { useEffect, useState } from "react"
import {
  AudioConference,
  ControlBar,
  LiveKitRoom,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  VideoConference,
} from "@livekit/components-react"
import { ConnectionState, RoomEvent } from "livekit-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { PhoneOff, ShieldCheck, Users, X } from "lucide-react"
import "@livekit/components-styles"

interface VideoCallInterfaceProps {
  roomId: string
  classId: string
  userName: string
  userRole: "teacher" | "learner"
  onEndCall: () => void
  isOpen: boolean
  onClose: () => void
}

function ModerationBar({ userRole, onEndCall }: { userRole: "teacher" | "learner"; onEndCall: () => void }) {
  const room = useRoomContext()
  const participants = useParticipants()
  const connectionState = useConnectionState()
  const { localParticipant } = useLocalParticipant()
  const [mutedParticipant, setMutedParticipant] = useState<string | null>(null)

  const endCall = async () => {
    await room.disconnect()
    onEndCall()
  }

  const muteParticipant = async (identity: string) => {
    if (userRole !== "teacher") return
    try {
      await fetch("/api/video/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomName: room.name, action: "mute", identity }),
      })
      setMutedParticipant(identity)
    } catch (error) {
      console.error("[v0] Unable to moderate participant", error)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-card px-3 py-2 text-xs md:px-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
        <span>{connectionState === ConnectionState.Connected ? "Secure call" : "Connecting"}</span>
        <span aria-hidden="true">·</span>
        <Users className="size-4" aria-hidden="true" />
        <span>{participants.length} connected</span>
      </div>
      <div className="flex items-center gap-2">
        {userRole === "teacher" && participants.filter((p) => p.identity !== localParticipant.identity).map((participant) => (
          <Button
            key={participant.identity}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => muteParticipant(participant.identity)}
            disabled={mutedParticipant === participant.identity}
          >
            {mutedParticipant === participant.identity ? "Muted" : `Mute ${participant.name || "participant"}`}
          </Button>
        ))}
        <Button type="button" variant="destructive" size="sm" onClick={endCall}>
          <PhoneOff data-icon="inline-start" />
          End call
        </Button>
      </div>
    </div>
  )
}

function CallRoom({ userRole, onEndCall }: { userRole: "teacher" | "learner"; onEndCall: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-muted/30">
      <div className="min-h-0 flex-1">
        <VideoConference />
      </div>
      <RoomAudioRenderer />
      <ModerationBar userRole={userRole} onEndCall={onEndCall} />
    </div>
  )
}

export function VideoCallInterface({ roomId, classId, userName, userRole, onEndCall, isOpen, onClose }: VideoCallInterfaceProps) {
  const [token, setToken] = useState<string>("")
  const [serverUrl, setServerUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")

  useEffect(() => {
    if (!isOpen || !roomId) return
    let cancelled = false
    setIsLoading(true)
    setError("")
    setToken("")

    fetch("/api/video/create-room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, classId, userName, userRole }),
    })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Unable to connect to the video call")
        if (!cancelled) {
          setToken(data.token)
          setServerUrl(data.serverUrl)
        }
      })
      .catch((reason: Error) => {
        if (!cancelled) setError(reason.message)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [classId, isOpen, roomId, userName, userRole])

  const handleEndCall = async () => {
    try {
      await fetch("/api/classes/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId }) })
    } finally {
      onEndCall()
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-screen w-screen max-w-none gap-0 overflow-hidden p-0 md:h-[95vh] md:max-h-[95vh] md:max-w-[95vw] md:rounded-lg">
        <Card className="flex h-full w-full flex-col rounded-none border-0 md:rounded-lg">
          <CardHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3 md:px-6">
            <div>
              <CardTitle className="text-base">{userRole === "teacher" ? "Teaching session" : "Learning session"}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">Private room with moderation controls</p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close video call">
              <X />
            </Button>
          </CardHeader>
          <CardContent className="min-h-0 flex-1 p-0">
            {isLoading && <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Setting up secure video call...</div>}
            {error && <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-destructive"><p>{error}</p><Button type="button" variant="outline" onClick={onClose}>Close</Button></div>}
            {token && serverUrl && <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video className="h-full"><CallRoom userRole={userRole} onEndCall={handleEndCall} /></LiveKitRoom>}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
