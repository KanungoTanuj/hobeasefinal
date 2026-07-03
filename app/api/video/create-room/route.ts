import { NextResponse } from "next/server"

/**
 * DEPRECATED: This endpoint is no longer used
 * 
 * Migration from Daily.co to LiveKit:
 * - Use /api/video/token instead to get LiveKit tokens
 * - Tokens are generated on-demand and expire after 30 minutes
 * - No more room creation API calls needed
 * 
 * This endpoint is kept for backward compatibility only
 */

export async function POST(request: Request) {
  console.warn(
    "[v0] Deprecated endpoint /api/video/create-room called. Use /api/video/token instead for LiveKit integration."
  )

  return NextResponse.json(
    {
      error: "This endpoint is deprecated. Use /api/video/token for LiveKit integration.",
      message: "The app now uses LiveKit instead of Daily.co. Tokens are generated via /api/video/token.",
    },
    { status: 410 }
  )
}
