"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useConnectionState,
  useLocalParticipant,
  useParticipants,
  useRoomContext,
  useTracks,
} from "@livekit/components-react"
import { ConnectionState, RoomEvent, Track, type Participant } from "livekit-client"
import { Button } from "@/components/ui/button"
import { ChatInterface } from "@/components/chat-interface"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  Camera,
  CameraOff,
  Check,
  Copy,
  Expand,
  Hand,
  MessageCircle,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Send,
  ShieldCheck,
  Users,
  Video,
  X,
} from "lucide-react"
import "@livekit/components-styles"

interface VideoCallInterfaceProps {
  roomId: string
  classId: string
  userName: string
  userRole: "teacher" | "learner"
  onEndCall: () => void
  isOpen: boolean
  onClose: () => void
  booking: {
    id: string
    learner_name: string
    learner_email: string
    teacher_name: string
    teacher_skill: string
    booking_date: string
    booking_time: string
    status: string
  }
  currentUserId: string
  currentUserEmail: string
}

type RoomChatMessage = { id: string; sender: string; text: string; sentAt: string }

const CHAT_TOPIC = "hobease-chat"
const HAND_TOPIC = "hobease-hand"

function decodeRoomData(payload: Uint8Array) {
  try {
    return JSON.parse(new TextDecoder().decode(payload)) as { type?: string; [key: string]: unknown }
  } catch {
    return null
  }
}

function getParticipantName(participant: Participant) {
  return participant.name || participant.identity || "Participant"
}

function ControlButton({ label, active, children, onClick, disabled }: { label: string; active?: boolean; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn("size-10 rounded-xl text-background/80 hover:bg-background/10 hover:text-background", active && "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground")}
    >
      {children}
    </Button>
  )
}

function InCallChat({ isOpen, onClose, booking, currentUserId, currentUserRole, currentUserEmail }: { isOpen: boolean; onClose: () => void; booking: VideoCallInterfaceProps["booking"]; currentUserId: string; currentUserRole: "teacher" | "learner"; currentUserEmail: string }) {
  return isOpen ? <ChatInterface booking={booking} currentUserId={currentUserId} currentUserRole={currentUserRole} currentUserEmail={currentUserEmail} onClose={onClose} /> : null
}

/* Legacy LiveKit chat is intentionally unused; persistent Supabase messages power classroom chat. */
function LegacyInCallChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [messages, setMessages] = useState<RoomChatMessage[]>([])
  const [draft, setDraft] = useState("")

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: Participant, _kind?: unknown, topic?: string) => {
      if (topic && topic !== CHAT_TOPIC) return
      const message = decodeRoomData(payload) as Partial<RoomChatMessage> & { type?: string } | null
      if (message?.type !== "chat" || !message.text) return
      setMessages((current) => {
        if (current.some((item) => item.id === message.id)) return current
        return [...current, { id: message.id || crypto.randomUUID(), sender: message.sender || getParticipantName(participant || localParticipant), text: message.text, sentAt: message.sentAt || new Date().toISOString() }]
      })
    }
    room.on(RoomEvent.DataReceived, handleData)
    return () => {
      room.off(RoomEvent.DataReceived, handleData)
    }
  }, [localParticipant, room])

  const sendMessage = async () => {
    const text = draft.trim()
    if (!text || !room.localParticipant) return
    const message: RoomChatMessage & { type: string } = { type: "chat", id: crypto.randomUUID(), sender: getParticipantName(room.localParticipant), text, sentAt: new Date().toISOString() }
    await room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(message)), { reliable: true, topic: "hobease-chat" })
    setMessages((current) => [...current, message])
    setDraft("")
  }

  if (!isOpen) return null

  return (
    <aside className="flex min-h-0 w-full flex-col border-t border-border bg-card text-foreground md:w-80 md:border-l md:border-t-0" aria-label="In-call chat">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <p className="text-sm font-semibold">Class chat</p>
          <p className="text-xs text-muted-foreground">Visible to everyone in this room</p>
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close class chat"><X /></Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
        {messages.length === 0 ? <div className="m-auto text-center text-sm text-muted-foreground"><MessageCircle className="mx-auto mb-2 size-6" /><p>No messages yet</p><p className="mt-1 text-xs">Share a question with the class.</p></div> : messages.map((message) => <div key={message.id} className="rounded-xl bg-muted px-3 py-2"><p className="text-xs font-semibold">{message.sender}</p><p className="mt-1 break-words text-sm">{message.text}</p><time className="mt-1 block text-[11px] text-muted-foreground" dateTime={message.sentAt}>{new Date(message.sentAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</time></div>)}
      </div>
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2 rounded-xl border border-input bg-background px-2 py-1">
          <input value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing && event.keyCode !== 229) void sendMessage() }} placeholder="Message the class" aria-label="Message the class" className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
          <Button type="button" size="icon" onClick={() => void sendMessage()} disabled={!draft.trim()} aria-label="Send class message"><Send /></Button>
        </div>
      </div>
    </aside>
  )
}

function ParticipantStage({ raisedHands }: { raisedHands: string[] }) {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }, { source: Track.Source.ScreenShare, withPlaceholder: false }],
    { onlySubscribed: false },
  )

  return <div className="h-full min-h-0 w-full min-w-0 overflow-y-auto overscroll-contain bg-[#18232c] p-3 md:p-5"><div className="grid min-h-0 w-full grid-cols-1 gap-3 md:grid-cols-2">{tracks.length > 0 ? tracks.map((track) => {
    const participantName = getParticipantName(track.participant)
    const isHandRaised = raisedHands.includes(track.participant.identity)
    return <div key={`${track.participant.identity}-${track.source}`} className="relative aspect-video min-h-0 min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#243642] shadow-xl">
      {isHandRaised && <div className="absolute inset-x-3 top-3 z-10 flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-lg"><Hand className="size-3.5" />{participantName} raised a hand</div>}
      <ParticipantTile trackRef={track} className="size-full overflow-hidden" />
    </div>
  }) : <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-white/15 text-center text-white/70"><div><Video className="mx-auto mb-2 size-8" /><p className="text-sm font-medium">Your classroom is ready</p><p className="mt-1 text-xs text-white/50">Turn on your camera or share your screen to begin.</p></div></div>}</div></div>
}

function LiveRoom({ userRole, onEndCall, booking, currentUserId, currentUserEmail }: { userRole: "teacher" | "learner"; onEndCall: () => void; booking: VideoCallInterfaceProps["booking"]; currentUserId: string; currentUserEmail: string }) {
  const room = useRoomContext()
  const participants = useParticipants()
  const { localParticipant } = useLocalParticipant()
  const connectionState = useConnectionState()
  const [audioReady, setAudioReady] = useState(false)
  const [audioError, setAudioError] = useState("")
  const [cameraOn, setCameraOn] = useState(false)
  const [microphoneOn, setMicrophoneOn] = useState(false)
  const [screenShareOn, setScreenShareOn] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [handRaised, setHandRaised] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const [raisedHands, setRaisedHands] = useState<string[]>([])

  useEffect(() => {
    setCameraOn(localParticipant.isCameraEnabled)
    setMicrophoneOn(localParticipant.isMicrophoneEnabled)
    setScreenShareOn(localParticipant.isScreenShareEnabled)
  }, [localParticipant])

  useEffect(() => {
    if (connectionState !== ConnectionState.Connected || localParticipant.isMicrophoneEnabled) return
    let cancelled = false
    void localParticipant.setMicrophoneEnabled(true).then(() => {
      if (!cancelled) {
        setMicrophoneOn(true)
        setAudioError("")
      }
    }).catch((error) => {
      console.error("[v0] Initial microphone publish failed", error)
      if (!cancelled) {
        setMicrophoneOn(false)
        setAudioError("Microphone access is blocked. Use your browser or phone permissions to allow it, then tap the microphone button.")
      }
    })
    return () => { cancelled = true }
  }, [connectionState, localParticipant])

  useEffect(() => {
    const handleData = (payload: Uint8Array, participant?: Participant, _kind?: unknown, topic?: string) => {
      if (topic && topic !== HAND_TOPIC) return
      const message = decodeRoomData(payload) as { type?: string; raised?: boolean } | null
      if (message?.type !== "hand") return
      const identity = participant?.identity
      if (!identity) return
      setRaisedHands((current) => message.raised ? Array.from(new Set([...current, identity])) : current.filter((item) => item !== identity))
    }
    room.on(RoomEvent.DataReceived, handleData)
    return () => { room.off(RoomEvent.DataReceived, handleData) }
  }, [room])

  const toggleCamera = async () => {
    try {
      const next = !localParticipant.isCameraEnabled
      await localParticipant.setCameraEnabled(next)
      setCameraOn(localParticipant.isCameraEnabled)
    } catch (error) {
      console.error("[v0] Camera toggle failed", error)
      setCameraOn(false)
    }
  }
  const toggleMicrophone = async () => {
    try {
      const next = !localParticipant.isMicrophoneEnabled
      await localParticipant.setMicrophoneEnabled(next)
      setMicrophoneOn(next)
    } catch (error) {
      console.error("[v0] Microphone toggle failed", error)
      setMicrophoneOn(false)
    }
  }
  const toggleScreenShare = async () => {
    try {
      const next = !localParticipant.isScreenShareEnabled
      await localParticipant.setScreenShareEnabled(next)
      setScreenShareOn(localParticipant.isScreenShareEnabled)
    } catch (error) {
      console.error("[v0] Screen share toggle failed", error)
      setScreenShareOn(false)
    }
  }
  const toggleHand = async () => {
    const next = !handRaised
    await localParticipant.publishData(new TextEncoder().encode(JSON.stringify({ type: "hand", raised: next })), { reliable: true, topic: "hobease-hand" })
    setHandRaised(next)
    setRaisedHands((current) => next ? Array.from(new Set([...current, localParticipant.identity])) : current.filter((item) => item !== localParticipant.identity))
  }
  const toggleFullscreen = async () => {
    if (!stageRef.current) return
    if (document.fullscreenElement) await document.exitFullscreen()
    else await stageRef.current.requestFullscreen()
    setFullscreen(Boolean(document.fullscreenElement))
  }
  useEffect(() => {
    const handleFullscreenChange = () => setFullscreen(document.fullscreenElement === stageRef.current)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const enableAudio = async () => {
    try {
      await room.startAudio()
      await localParticipant.setMicrophoneEnabled(true)
      setMicrophoneOn(true)
      setAudioReady(true)
      setAudioError("")
    } catch (error) {
      console.error("[v0] Audio playback unlock failed", error)
      setAudioError("Tap again to enable class audio.")
    }
  }

  const endCall = async () => { await room.disconnect(); onEndCall() }

  return <div ref={stageRef} className="h-full min-h-0 min-w-0 relative flex flex-1 basis-0 flex-col overflow-hidden bg-[#18232c] text-white hobease-video-stage">
    <RoomAudioRenderer />
    {!audioReady && <div className="absolute inset-x-3 top-16 z-30 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#20313d]/95 px-4 py-3 text-sm shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-4 sm:max-w-sm"><div><p className="font-semibold">Enable class audio</p><p className="mt-0.5 text-xs text-white/60">Mobile browsers need one tap before remote audio can play.</p>{audioError && <p className="mt-1 text-xs text-primary">{audioError}</p>}</div><Button type="button" size="sm" onClick={() => void enableAudio()}>Enable</Button></div>}
    <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-[#20313d] px-4 py-3"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-4" /></div><div><p className="text-sm font-semibold">Hobease live classroom</p><p className="text-xs text-white/60">{connectionState === ConnectionState.Connected ? "Connected securely" : "Connecting securely"}</p></div></div><div className="flex max-w-[60%] flex-wrap items-center justify-end gap-2 text-xs text-white/60"><span className="flex items-center gap-1.5"><Users className="size-4" />{participants.length} connected</span><div className="hidden items-center gap-1.5 sm:flex">{participants.map((participant) => <span key={participant.identity} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-white/75">{getParticipantName(participant)}</span>)}</div>{raisedHands.length > 0 && <span className="rounded-full bg-primary/20 px-2 py-1 text-primary">{raisedHands.length} hand{raisedHands.length === 1 ? "" : "s"} raised</span>}</div></div>
    <div className="relative flex min-h-0 flex-1 flex-col md:flex-row"><ParticipantStage raisedHands={raisedHands} /><div className={cn("absolute inset-x-0 bottom-0 top-0 z-20 flex min-h-0 flex-col shadow-2xl transition-transform md:static md:z-auto md:w-80 md:shrink-0 md:translate-x-0", chatOpen ? "translate-x-0" : "translate-x-full md:hidden")}><InCallChat isOpen={chatOpen} onClose={() => setChatOpen(false)} booking={booking} currentUserId={currentUserId} currentUserRole={userRole} currentUserEmail={currentUserEmail} /></div></div>
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#20313d] px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:gap-3"><ControlButton label={microphoneOn ? "Mute microphone" : "Unmute microphone"} active={microphoneOn} onClick={() => void toggleMicrophone()}>{microphoneOn ? <Mic /> : <MicOff />}</ControlButton><ControlButton label={cameraOn ? "Turn camera off" : "Turn camera on"} active={cameraOn} onClick={() => void toggleCamera()}>{cameraOn ? <Camera /> : <CameraOff />}</ControlButton><ControlButton label={screenShareOn ? "Stop sharing screen" : "Share screen"} active={screenShareOn} onClick={() => void toggleScreenShare()}>{screenShareOn ? <MonitorUp /> : <MonitorUp />}</ControlButton><ControlButton label={handRaised ? "Lower hand" : "Raise hand"} active={handRaised} onClick={() => void toggleHand()}>{<Hand />}</ControlButton><ControlButton label={chatOpen ? "Close class chat" : "Open class chat"} active={chatOpen} onClick={() => setChatOpen((value) => !value)}><MessageCircle /></ControlButton><ControlButton label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} active={fullscreen} onClick={() => void toggleFullscreen()}><Expand /></ControlButton><Button type="button" variant="destructive" className="ml-2 rounded-xl" onClick={endCall}><PhoneOff data-icon="inline-start" />End call</Button></div>
  </div>
}

export function VideoCallInterface({ roomId, classId, userName, userRole, onEndCall, isOpen, onClose, booking, currentUserId, currentUserEmail }: VideoCallInterfaceProps) {
  const [token, setToken] = useState("")
  const [serverUrl, setServerUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const handleEndCall = async () => { try { await fetch("/api/classes/end", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId }) }) } finally { onEndCall(); onClose() } }
  useEffect(() => {
    if (!isOpen || !roomId) return
    let cancelled = false
    setIsLoading(true); setError(""); setToken("")
    fetch("/api/video/create-room", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ roomId, classId, userName, userRole }) }).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Unable to connect to the video call"); if (!cancelled) { setToken(data.token); setServerUrl(data.serverUrl) } }).catch((reason: Error) => { if (!cancelled) setError(reason.message) }).finally(() => { if (!cancelled) setIsLoading(false) })
    return () => { cancelled = true }
  }, [classId, isOpen, roomId, userName, userRole])
  return <Dialog open={isOpen} onOpenChange={onClose}><DialogContent className="h-[100dvh] max-h-[100dvh] w-[100dvw] max-w-none gap-0 overflow-hidden p-0 md:h-[min(95dvh,860px)] md:max-h-[95dvh] md:w-[min(95dvw,1280px)] md:max-w-[1280px] md:rounded-2xl"><Card className="flex h-full min-h-0 w-full flex-col rounded-none border-0 md:rounded-2xl"><CardHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3 md:px-6"><div><CardTitle className="text-base">{userRole === "teacher" ? "Teaching session" : "Learning session"}</CardTitle><p className="mt-1 text-xs text-muted-foreground">Private Hobease classroom</p></div><Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close video call"><X /></Button></CardHeader><CardContent className="min-h-0 flex-1 overflow-hidden p-0">{isLoading && <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Setting up secure video call...</div>}{error && <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center text-sm text-destructive"><p>{error}</p><Button type="button" variant="outline" onClick={onClose}>Close</Button></div>}{token && serverUrl && <LiveKitRoom token={token} serverUrl={serverUrl} connect audio video className="h-full"><LiveRoom userRole={userRole} onEndCall={handleEndCall} booking={booking} currentUserId={currentUserId} currentUserEmail={currentUserEmail} /></LiveKitRoom>}</CardContent></Card></DialogContent></Dialog>
}
