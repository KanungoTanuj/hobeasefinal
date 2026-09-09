import { RoomServiceClient } from "livekit-server-sdk"
import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { roomName, action, identity } = await request.json()
    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || user.user_metadata?.role !== "teacher") {
      return NextResponse.json({ error: "Teacher authorization required" }, { status: 403 })
    }
    if (!roomName || action !== "mute" || !identity) {
      return NextResponse.json({ error: "Invalid moderation request" }, { status: 400 })
    }

    const url = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    if (!url || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Video service is not configured" }, { status: 503 })
    }

    const service = new RoomServiceClient(url, apiKey, apiSecret)
    await service.mutePublishedTrack(roomName, identity, "audio", true)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] Error moderating LiveKit participant", error)
    return NextResponse.json({ error: "Unable to moderate participant" }, { status: 500 })
  }
}
