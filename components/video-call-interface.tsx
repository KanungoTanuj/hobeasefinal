"use client"

import { useEffect, useRef, useState } from "react"
import { Room, RoomEvent, Track, type RemoteTrackPublication, type RemoteParticipant } from "livekit-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneOff, Maximize2, Minimize2, Mic, MicOff, Video, VideoOff } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface VideoCallInterfaceProps {
  roomId: string
  classId: string
  userName: string
  userRole: "teacher" | "learner"
  onEndCall: () => void
  isOpen: boolean
  onClose: () => void
}

export function VideoCallInterface({ roomId, classId, userName, userRole, onEndCall, isOpen, onClose }: VideoCallInterfaceProps) {
  const roomRef = useRef<Room | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMicEnabled, setIsMicEnabled] = useState(true)
  const [isCameraEnabled, setIsCameraEnabled] = useState(true)
  const [remoteParticipant, setRemoteParticipant] = useState<RemoteParticipant | null>(null)

  useEffect(() => {
    if (!isOpen || !roomId) return

    let cancelled = false
    const room = new Room({ adaptiveStream: true, dynacast: true })
    roomRef.current = room

    const attachRemoteVideo = (participant: RemoteParticipant) => {
      const publication = Array.from(participant.videoTrackPublications.values()).find((item) => item.isSubscribed)
      publication?.videoTrack?.attach(remoteVideoRef.current ?? undefined)
      setRemoteParticipant(participant)
    }

    const connect = async () => {
      try {
        const response = await fetch("/api/video/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, userName, userRole }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Unable to connect to video room")

        room.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
          if (track.kind === Track.Kind.Video) {
            track.attach(remoteVideoRef.current ?? undefined)
            setRemoteParticipant(participant)
          }
        })
        room.on(RoomEvent.TrackUnsubscribed, (track) => track.detach())
        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          if (participant === remoteParticipant) setRemoteParticipant(null)
        })

        await room.connect(data.url, data.token)
        await room.localParticipant.enableCameraAndMicrophone()
        room.localParticipant.videoTrackPublications.forEach((publication) => {
          publication.track?.attach(localVideoRef.current ?? undefined)
        })
        if (!cancelled) setIsLoading(false)

        const participant = Array.from(room.remoteParticipants.values())[0]
        if (participant) attachRemoteVideo(participant)
      } catch (connectError) {
        if (!cancelled) {
          setError(connectError instanceof Error ? connectError.message : "Unable to connect to video room")
          setIsLoading(false)
        }
      }
    }

    connect()
    return () => {
      cancelled = true
      room.disconnect()
      roomRef.current = null
    }
  }, [isOpen, roomId, userName, userRole])

  const handleEndCall = async () => {
    await fetch("/api/classes/end", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId }),
    }).catch(() => undefined)
    roomRef.current?.disconnect()
    onEndCall()
    onClose()
  }

  const toggleMicrophone = async () => {
    const next = !isMicEnabled
    await roomRef.current?.localParticipant.setMicrophoneEnabled(next)
    setIsMicEnabled(next)
  }

  const toggleCamera = async () => {
    const next = !isCameraEnabled
    await roomRef.current?.localParticipant.setCameraEnabled(next)
    setIsCameraEnabled(next)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.querySelector("[data-video-stage]")?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 md:max-w-[95vw] md:max-h-[95vh] md:h-[95vh] md:rounded-lg">
        <Card className="h-full w-full flex flex-col border-0 rounded-none md:rounded-lg">
          <CardHeader className="pb-2 pt-3 px-3 md:pb-3 md:pt-6 md:px-6 border-b shrink-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm md:text-lg truncate">{userRole === "teacher" ? "Teaching" : "Learning"}</CardTitle>
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <Button variant="outline" size="sm" onClick={toggleFullscreen} className="hidden md:flex bg-transparent" aria-label="Toggle fullscreen">
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleEndCall} className="text-xs md:text-sm"><PhoneOff className="h-3 w-3 md:h-4 md:w-4 md:mr-1" /><span className="hidden md:inline">End Call</span></Button>
              </div>
            </div>
          </CardHeader>
          <CardContent data-video-stage className="flex-1 p-0 relative overflow-hidden bg-slate-950">
            {isLoading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/90"><p className="text-sm text-muted-foreground">Connecting to your live class...</p></div>}
            {error && <div className="absolute inset-0 z-10 flex items-center justify-center p-6 text-center"><div><p className="font-medium">Video connection unavailable</p><p className="mt-2 text-sm text-muted-foreground">{error}</p></div></div>}
            <video ref={remoteVideoRef} autoPlay playsInline className="h-full w-full object-contain" aria-label={remoteParticipant ? `${remoteParticipant.name || "Participant"} video` : "Waiting for participant"} />
            <video ref={localVideoRef} autoPlay muted playsInline className="absolute bottom-4 right-4 z-[1] h-28 w-44 rounded-lg bg-slate-900 object-cover shadow-lg md:h-36 md:w-56" aria-label="Your video" />
            <div className="absolute bottom-4 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-2 rounded-full bg-slate-900/90 p-2">
              <Button variant="secondary" size="icon" onClick={toggleMicrophone} aria-label={isMicEnabled ? "Mute microphone" : "Unmute microphone"}>{isMicEnabled ? <Mic /> : <MicOff />}</Button>
              <Button variant="secondary" size="icon" onClick={toggleCamera} aria-label={isCameraEnabled ? "Turn camera off" : "Turn camera on"}>{isCameraEnabled ? <Video /> : <VideoOff />}</Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
