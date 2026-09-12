import { NextRequest, NextResponse } from "next/server"

const cache = new Map<string, string>()
const supportedLanguages = new Set(["en", "hi", "es", "de", "fr"])

export async function POST(request: NextRequest) {
  try {
    const { text, targetLanguage } = (await request.json()) as { text?: string; targetLanguage?: string }
    if (!text || !targetLanguage || !supportedLanguages.has(targetLanguage)) {
      return NextResponse.json({ error: "Invalid translation request" }, { status: 400 })
    }
    if (targetLanguage === "en") return NextResponse.json({ translatedText: text })

    const key = `${targetLanguage}:${text}`
    const cached = cache.get(key)
    if (cached) return NextResponse.json({ translatedText: cached })

    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLanguage}`,
      { next: { revalidate: 86400 } },
    )
    if (!response.ok) return NextResponse.json({ translatedText: text })
    const data = await response.json()
    const translatedText = data.responseData?.translatedText || text
    cache.set(key, translatedText)
    return NextResponse.json({ translatedText })
  } catch {
    return NextResponse.json({ translatedText: "" }, { status: 200 })
  }
}
