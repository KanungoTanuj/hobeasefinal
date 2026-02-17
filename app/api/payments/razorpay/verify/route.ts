import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { orderId, paymentId, signature } = await req.json()

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      return NextResponse.json({ error: "Missing Razorpay secret" }, { status: 500 })
    }
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment verification fields" }, { status: 400 })
    }

    const payload = `${orderId}|${paymentId}`
    const expected = crypto.createHmac("sha256", keySecret).update(payload).digest("hex")
    const valid = expected === signature

    return NextResponse.json({ valid })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}
