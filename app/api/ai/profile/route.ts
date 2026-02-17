import { NextResponse } from "next/server"
import { generateProfile } from "@/lib/ai"

export async function POST(req: Request) {
  const { name, skill, experience, style } = await req.json()
  const bio = await generateProfile({ name, skill, experience, style })
  return NextResponse.json({ success: true, bio })
}
