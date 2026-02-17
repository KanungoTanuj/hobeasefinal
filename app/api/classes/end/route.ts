import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { classId } = await request.json()

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    // Get the current user
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    // Get class details
    const { data: classData, error: classError } = await supabase.from("classes").select("*").eq("id", classId).single()

    if (classError || !classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    // Check if user is teacher or student in this class
    if (classData.teacher_id !== userId && classData.student_id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Update class end time
    const { error: updateError } = await supabase
      .from("classes")
      .update({ end_time: new Date().toISOString() })
      .eq("id", classId)

    if (updateError) {
      console.error("[v0] Error ending class:", updateError)
      return NextResponse.json({ error: "Failed to end class" }, { status: 500 })
    }

    return NextResponse.json({ message: "Class ended successfully" })
  } catch (error) {
    console.error("[v0] Error ending class:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
