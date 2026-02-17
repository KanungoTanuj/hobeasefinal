import { NextResponse } from "next/server"
import { categorizeSkill } from "@/lib/ai"

export async function POST(req: Request) {
  const { text } = await req.json()
  return NextResponse.json({ success: true, category: categorizeSkill(text || "") })
}
