import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse the form data
    const formData = await request.formData()

    // Extract form fields
    const teacherData = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      skill: formData.get("skill") as string,
      experience: formData.get("experience") as string,
      bio: formData.get("bio") as string,
      photo: formData.get("photo") as File | null,
    }

    // Log the received data (dummy implementation)
    console.log("[v0] Teacher registration received:", {
      ...teacherData,
      photo: teacherData.photo ? `${teacherData.photo.name} (${teacherData.photo.size} bytes)` : null,
    })

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const generateUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c == "x" ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    }

    // Dummy success response
    return NextResponse.json(
      {
        success: true,
        message: "Teacher registration submitted successfully",
        data: {
          id: generateUUID(), // Use UUID format instead of random string
          name: teacherData.name,
          email: teacherData.email,
          skill: teacherData.skill,
          status: "pending_review",
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Teacher registration error:", error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to process teacher registration",
      },
      { status: 500 },
    )
  }
}
