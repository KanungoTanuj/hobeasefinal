"use client"

import { useEffect, useState } from "react"
import { LiveKitRoom, VideoConference, GridLayout } from "@livekit/components-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneOff, Maximize2, Minimize2, Loader2 } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import "@livekit/components-styles"

interface VideoCallInterfaceProps {
  token: string
  roomName: string
  classId: string
  userName: string
  userRole: "teacher" | "learner"
  onEndCall: () => void
  isOpen: boolean
  onClose: () => void
}

export function VideoCallInterface({
  token,
  roomName,
  classId,
  userName,
  userRole,
  onEndCall,
  isOpen,
  onClose,
}: VideoCallInterfaceProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isConnecting, setIsConnecting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const liveKitUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL

  useEffect(() => {
    if (isOpen) {
      console.log("[v0] VideoCallInterface mounted, roomName:", roomName)
      console.log("[v0] userName:", userName, "userRole:", userRole)
      console.log("[v0] LiveKit URL:", liveKitUrl)

      if (!token || !roomName) {
        setError("Missing token or room name")
        setIsConnecting(false)
        return
      }

      if (!liveKitUrl) {
        setError("LiveKit URL not configured")
        setIsConnecting(false)
        return
      }

      setError(null)
      setIsConnecting(false)
    }
  }, [isOpen, token, roomName, liveKitUrl, userName, userRole])

  const handleEndCall = async () => {
    try {
      console.log("[v0] Ending call for classId:", classId)
      await fetch("/api/classes/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId }),
      })

      onEndCall()
      onClose()
    } catch (err) {
      console.error("[v0] Error ending call:", err)
      onEndCall()
      onClose()
    }
  }

  const toggleFullscreen = async () => {
    const dialog = document.querySelector('[role="dialog"]')
    if (!dialog) return

    try {
      if (!document.fullscreenElement) {
        await dialog.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (err) {
      console.error("[v0] Fullscreen error:", err)
    }
  }

  if (!token || !roomName || !liveKitUrl) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-screen h-screen max-w-none max-h-none p-0 m-0 md:max-w-[95vw] md:max-h-[95vh] md:h-[95vh] md:rounded-lg">
        <Card className="h-full w-full flex flex-col border-0 rounded-none md:rounded-lg">
          <CardHeader className="pb-2 pt-3 px-3 md:pb-3 md:pt-6 md:px-6 border-b shrink-0">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-sm md:text-lg truncate">
                {userRole === "teacher" ? "Teaching" : "Learning"} Session
              </CardTitle>
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="hidden md:flex bg-transparent"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
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
            {isConnecting || error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10">
                <div className="text-center px-4">
                  {isConnecting ? (
                    <>
                      <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
                      <p className="text-white text-sm md:text-base">
                        Connecting to session...
                      </p>
                      <p className="text-xs md:text-sm text-gray-400 mt-2">
                        {userRole === "teacher"
                          ? "Preparing your teaching session..."
                          : "Connecting to your teacher..."}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-red-400 text-sm md:text-base">{error}</p>
                      <Button
                        onClick={onClose}
                        className="mt-4"
                        variant="outline"
                      >
                        Close
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            <LiveKitRoom
              video={true}
              audio={true}
              token={token}
              serverUrl={liveKitUrl}
              data-lk-theme="dark"
              onError={(err) => {
                console.error("[v0] LiveKit error:", err)
                setError(
                  "Failed to connect. Please check your connection and try again."
                )
              }}
              onConnected={() => {
                console.log(
                  "[v0] Successfully connected to LiveKit room:",
                  roomName
                )
              }}
            >
              <VideoConference />
            </LiveKitRoom>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

export default VideoCallInterface
