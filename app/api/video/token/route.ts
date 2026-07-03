import { NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabase"
import { AccessToken } from "livekit-server-sdk"

interface TokenRequest {
  classId: string
  roomName: string
}

export async function POST(request: Request) {
  try {
    const { classId, roomName } = (await request.json()) as TokenRequest

    if (!classId || !roomName) {
      return NextResponse.json(
        { error: "classId and roomName are required" },
        { status: 400 }
      )
    }

    // Get current user from Supabase
    const supabase = createServerComponentClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error("[v0] No user found in session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[v0] Token request for classId:", classId, "userId:", user.id)

    // Verify user belongs to this class (either as teacher or learner)
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("id, teacher_id, student_id, booking_id")
      .eq("id", classId)
      .single()

    if (classError || !classData) {
      console.error("[v0] Class not found:", classError)
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if user is teacher or learner
    const isTeacher = classData.teacher_id === user.id
    const isLearner = classData.student_id === user.id

    if (!isTeacher && !isLearner) {
      console.error(
        "[v0] User unauthorized for this class:",
        user.id,
        "teacher_id:",
        classData.teacher_id,
        "student_id:",
        classData.student_id
      )
      return NextResponse.json(
        { error: "You don't have access to this class" },
        { status: 403 }
      )
    }

    // Get user name
    const { data: userData } = await supabase
      .from(isTeacher ? "Teachers" : "learners")
      .select("name")
      .eq("id", user.id)
      .single()

    const userName = userData?.name || user.email || "User"

    // Generate LiveKit token
    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET

    if (!apiKey || !apiSecret) {
      console.error("[v0] LiveKit credentials not configured")
      return NextResponse.json(
        { error: "Video service not configured" },
        { status: 500 }
      )
    }

    try {
      const at = new AccessToken(apiKey, apiSecret)
      at.identity = user.id
      at.name = userName

      if (isTeacher) {
        // Teacher gets full permissions
        at.addGrant({
          room: roomName,
          roomJoin: true,
          canPublish: true,
          canPublishData: true,
          canSubscribe: true,
          // Advanced permissions for teacher
          canPublishSources: ["camera", "microphone", "screen_share"],
          canUpdateOwnMetadata: true,
        })
      } else {
        // Learner gets basic permissions
        at.addGrant({
          room: roomName,
          roomJoin: true,
          canPublish: true,
          canPublishData: true,
          canSubscribe: true,
          canPublishSources: ["camera", "microphone"],
          canUpdateOwnMetadata: true,
        })
      }

      // Token expires in 30 minutes (1800 seconds)
      at.ttl = 1800

      const token = at.toJwt()

      console.log("[v0] Generated token for user:", user.id, "room:", roomName)

      return NextResponse.json({
        token,
        roomName,
        identity: user.id,
        userName,
      })
    } catch (tokenError) {
      console.error("[v0] Failed to generate token:", tokenError)
      return NextResponse.json(
        { error: "Failed to generate access token" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("[v0] Token endpoint error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
