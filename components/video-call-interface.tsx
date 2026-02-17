"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PhoneOff, Maximize2, Minimize2 } from "lucide-react"
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

export function VideoCallInterface({
  roomId,
  classId,
  userName,
  userRole,
  onEndCall,
  isOpen,
  onClose,
}: VideoCallInterfaceProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [dailyRoomUrl, setDailyRoomUrl] = useState<string>("")

  useEffect(() => {
    if (!isOpen || !roomId) return

    console.log("[v0] VideoCallInterface mounted, roomId:", roomId)
    console.log("[v0] userName:", userName, "userRole:", userRole)

    // Create Daily.co room
    const createDailyRoom = async () => {
      try {
        const response = await fetch("/api/video/create-room", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roomId, userName }),
        })

        if (!response.ok) {
          throw new Error("Failed to create video room")
        }

        const data = await response.json()
        setDailyRoomUrl(data.url)
        setIsLoading(false)
      } catch (error) {
        console.error("[v0] Error creating Daily room:", error)
        setIsLoading(false)
      }
    }

    createDailyRoom()
  }, [isOpen, roomId, userName])

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
    } catch (error) {
      console.error("[v0] Error ending call:", error)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      iframeRef.current?.requestFullscreen()
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
              <CardTitle className="text-sm md:text-lg truncate">
                {userRole === "teacher" ? "Teaching" : "Learning"}
              </CardTitle>
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="hidden md:flex bg-transparent"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                </Button>
                <Button variant="destructive" size="sm" onClick={handleEndCall} className="text-xs md:text-sm">
                  <PhoneOff className="h-3 w-3 md:h-4 md:w-4 md:mr-1" />
                  <span className="hidden md:inline">End Call</span>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 relative overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-center px-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground text-sm md:text-base">Setting up video call...</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-2">
                    {userRole === "teacher" ? "Preparing your teaching session..." : "Connecting to your teacher..."}
                  </p>
                </div>
              </div>
            )}
            {dailyRoomUrl && (
              <iframe
                ref={iframeRef}
                src={dailyRoomUrl}
                allow="camera; microphone; fullscreen; speaker; display-capture; autoplay"
                className="w-full h-full border-0"
                style={{ touchAction: "manipulation" }}
              />
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
