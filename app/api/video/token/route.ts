import { NextResponse } from "next/server"
import { AccessToken } from "livekit-server-sdk"
import { createServerComponentClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { classId } = await request.json()
    if (!classId || typeof classId !== "string") {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    const apiKey = process.env.LIVEKIT_API_KEY
    const apiSecret = process.env.LIVEKIT_API_SECRET
    const livekitUrl = process.env.LIVEKIT_URL
    if (!apiKey || !apiSecret || !livekitUrl) {
      return NextResponse.json({ error: "Video classroom is not configured" }, { status: 503 })
    }

    const supabase = await createServerComponentClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: classroom } = await supabase
      .from("classes")
      .select("id, booking_id, room_id, teacher_id, student_id, start_time, end_time")
      .eq("id", classId)
      .maybeSingle()

    if (!classroom || classroom.end_time || !classroom.room_id) {
      return NextResponse.json({ error: "Classroom is unavailable" }, { status: 404 })
    }

    const { data: teacher } = await supabase.from("Teachers").select("id, name").eq("auth_id", user.id).maybeSingle()
    const { data: booking } = await supabase
      .from("bookings")
      .select("id, learner_auth_id, learner_name, teacher_id, status")
      .eq("id", classroom.booking_id)
      .maybeSingle()

    if (!classroom || classroom.end_time || !classroom.room_id) {
      return NextResponse.json({ error: "Classroom is unavailable" }, { status: 404 })
    }

    const isTeacher = Boolean(teacher && String(teacher.id) === String(classroom.teacher_id))
    const isLearner = Boolean(booking?.learner_auth_id === user.id)
    if (!isTeacher && !isLearner) {
      return NextResponse.json({ error: "You are not enrolled in this class" }, { status: 403 })
    }

    const displayName = isTeacher ? teacher?.name || user.email || "Teacher" : booking?.learner_name || user.email || "Learner"
    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: displayName,
      ttl: "2h",
    })
    token.addGrant({
      room: classroom.room_id,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isTeacher,
      roomCreate: false,
    })

    return NextResponse.json({ token: await token.toJwt(), url: livekitUrl, roomName: classroom.room_id, role: isTeacher ? "teacher" : "learner" })
  } catch (error) {
    console.error("[v0] Classroom token error", error)
    return NextResponse.json({ error: "Unable to join classroom" }, { status: 500 })
  }
}
