"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneOff, AlertCircle } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import {
  LiveKitRoom,
  VideoConference,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useParticipants,
} from "@livekit/components-react"
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

export function VideoCallInterface({
  roomId,
  classId,
  userName,
  userRole,
  onEndCall,
  isOpen,
  onClose,
}: VideoCallInterfaceProps) {
  const [token, setToken] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !classId) {
      setIsLoading(true)
      setToken("")
      return
    }

    const generateToken = async () => {
      try {
        setIsLoading(true)
        setError(null)
        console.log("[v0] Requesting token for classId:", classId, "roomId:", roomId)

        const response = await fetch("/api/video/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId,
            roomName: roomId,
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to generate video token")
        }

        const data = await response.json()
        setToken(data.token)
        console.log("[v0] Token generated successfully for room:", data.roomName)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to connect to video"
        setError(errorMsg)
        console.error("[v0] Error generating token:", err)
      } finally {
        setIsLoading(false)
      }
    }

    generateToken()
  }, [isOpen, classId, roomId])

  const handleEndCall = async () => {
    try {
      console.log("[v0] Ending call for classId:", classId)
      await fetch("/api/classes/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      })

      setToken("")
      onEndCall()
      onClose()
    } catch (err) {
      console.error("[v0] Error ending call:", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 md:max-w-[95vw] md:max-h-[95vh] md:h-[95vh] md:rounded-lg">
        <Card className="h-full w-full flex flex-col border-0 rounded-none md:rounded-lg">
          <CardHeader className="pb-2 pt-3 px-3 md:pb-3 md:pt-6 md:px-6 border-b shrink-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm md:text-lg truncate">
                {userRole === "teacher" ? "Teaching Session" : "Learning Session"}
              </CardTitle>
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndCall}
                  className="text-xs md:text-sm"
                >
                  <PhoneOff className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                  <span className="hidden md:inline">End Call</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 relative overflow-hidden bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center px-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground text-sm md:text-base">Connecting to video call...</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2">
                    Please wait while we set up your {userRole === "teacher" ? "teaching" : "learning"} session
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center px-4">
                  <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <p className="text-destructive font-semibold text-sm md:text-base mb-2">Connection Error</p>
                  <p className="text-muted-foreground text-xs md:text-sm mb-4">{error}</p>
                  <Button onClick={onClose} variant="outline" size="sm">
                    Close
                  </Button>
                </div>
              </div>
            )}

            {token && !isLoading && !error && (
              <LiveKitRoom
                video={true}
                audio={true}
                token={token}
                serverUrl={process.env.NEXT_PUBLIC_LIVEKIT_URL}
                data-lk-theme="dark"
                style={{ height: "100%", width: "100%" }}
              >
                <VideoConference />
                <RoomAudioRenderer />
                <ControlBar />
              </LiveKitRoom>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
