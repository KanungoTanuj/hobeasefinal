import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amount, currency = "INR", receipt, notes } = body || {}

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json({ error: "Missing Razorpay credentials" }, { status: 500 })
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const basic = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      }),
    })

    const json = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: json?.error || json }, { status: res.status })
    }

    return NextResponse.json({ orderId: json.id, keyId })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 })
  }
}
