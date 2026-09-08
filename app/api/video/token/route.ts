import { AccessToken } from "livekit-server-sdk"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { roomId, userName, userRole } = await request.json()

    if (typeof roomId !== "string" || !roomId.trim() || typeof userName !== "string" || !userName.trim()) {
      return NextResponse.json({ error: "Room and participant details are required" }, { status: 400 })
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const livekitUrl = process.env.LIVEKIT_URL

    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({ error: "Video service is not configured" }, { status: 503 })
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: `${userRole === "teacher" ? "teacher" : "learner"}-${userName.trim()}-${crypto.randomUUID()}`,
      name: userName.trim(),
      metadata: JSON.stringify({ role: userRole === "teacher" ? "teacher" : "learner" }),
      ttl: "2h",
    })

    token.addGrant({ room: roomId.trim(), roomJoin: true, canPublish: true, canSubscribe: true })

    return NextResponse.json({ token: await token.toJwt(), url: livekitUrl })
  } catch (error) {
    console.error("[v0] Error creating LiveKit token:", error)
    return NextResponse.json({ error: "Unable to join video room" }, { status: 500 })
  }
}
