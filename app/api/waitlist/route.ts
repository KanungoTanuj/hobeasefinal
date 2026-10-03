import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"
import { z } from "zod"

const waitlistSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120, "Name is too long."),
  email: z.string().trim().email("Please enter a valid email address.").max(320),
  interest: z.enum(["teach", "learn", "both"]),
})

export async function POST(request: Request) {
  try {
    const parsed = waitlistSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Please check your details." }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[v0] Waitlist persistence is not configured")
      return NextResponse.json({ error: "Waitlist signups are temporarily unavailable. Please try again later." }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    const { error } = await supabase.from("waitlist_signups").insert({
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase(),
      interest: parsed.data.interest,
    })

    if (error?.code === "23505") {
      return NextResponse.json({ status: "already_registered", message: "You’re already on the list. We’ll be in touch when Hobease is ready." })
    }
    if (error) {
      console.error("[v0] Waitlist insert failed:", error)
      return NextResponse.json({ error: "We couldn’t save your spot right now. Please try again." }, { status: 500 })
    }

    return NextResponse.json({ status: "registered", message: "You’re on the list. We’ll keep you posted as Hobease gets ready." }, { status: 201 })
  } catch (error) {
    console.error("[v0] Waitlist request failed:", error)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

