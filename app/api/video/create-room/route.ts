import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { roomId, userName } = await request.json()

    const dailyApiKey = process.env.DAILY_API_KEY || "bbd818e92aa3d8af71bd153e08be948d79b1d2a9bad8eba412a8e788e4f3feca"
    const dailyDomain = process.env.DAILY_DOMAIN || "hobease.daily.co"

    if (!dailyApiKey) {
      console.error("[v0] Daily.co API key not configured")
      return NextResponse.json({ error: "Video service not configured" }, { status: 500 })
    }

    // Create a room using Daily.co API
    const response = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        name: roomId,
        privacy: "public",
        properties: {
          enable_screenshare: true,
          enable_chat: true,
          start_video_off: false,
          start_audio_off: false,
          max_participants: 2,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] Daily.co API error:", errorData)

      // If room already exists, that's okay - just use it
      if (errorData.error === "room-name-already-exists" || response.status === 409) {
        const roomUrl = `https://${dailyDomain}/${roomId}?t=${encodeURIComponent(userName)}`
        console.log("[v0] Using existing Daily.co room:", roomUrl)
        return NextResponse.json({
          url: roomUrl,
          roomId: roomId,
        })
      }

      return NextResponse.json({ error: "Failed to create video room" }, { status: 500 })
    }

    const roomData = await response.json()
    const roomUrl = `${roomData.url}?t=${encodeURIComponent(userName)}`

    console.log("[v0] Created Daily.co room:", roomUrl)

    return NextResponse.json({
      url: roomUrl,
      roomId: roomId,
      roomData: roomData,
    })
  } catch (error) {
    console.error("[v0] Error creating Daily room:", error)
    return NextResponse.json({ error: "Failed to create video room" }, { status: 500 })
  }
}
