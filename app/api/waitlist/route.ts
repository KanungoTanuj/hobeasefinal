import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { z } from "zod"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function createWaitlistAdminClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Waitlist Supabase admin credentials are not configured")
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

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

    const supabase = createWaitlistAdminClient()
    const email = parsed.data.email.toLowerCase()
    const { error } = await supabase.from("waitlist_signups").insert({
      name: parsed.data.name,
      email,
      interest: parsed.data.interest,
    })

    const duplicateErrorText = [error?.message, error?.details, error?.hint].filter(Boolean).join(" ")
    if (error?.code === "23505" && /email/i.test(duplicateErrorText)) {
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

