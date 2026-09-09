import { AccessToken } from "livekit-server-sdk"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { roomId, userName, userRole } = await request.json()
    if (!roomId || !userName || !["teacher", "learner"].includes(userRole)) {
      return NextResponse.json({ error: "Invalid video room details" }, { status: 400 })
    }

    const url = process.env.LIVEKIT_URL
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    if (!url || !apiKey || !apiSecret) {
      return NextResponse.json({ error: "Video service is not configured" }, { status: 503 })
    }

    const identity = `${userRole}:${crypto.randomUUID()}`
    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: userName,
      ttl: "2h",
      metadata: JSON.stringify({ role: userRole }),
    })
    token.addGrant({
      room: roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: userRole === "teacher",
    })

    return NextResponse.json({ token: await token.toJwt(), serverUrl: url, roomId })
  } catch (error) {
    console.error("[v0] Error creating LiveKit token", error)
    return NextResponse.json({ error: "Failed to connect to video room" }, { status: 500 })
  }
}
