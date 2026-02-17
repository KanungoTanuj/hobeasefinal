import { NextResponse } from "next/server"
import { scoreRecommendation, categorizeSkill } from "@/lib/ai"
import { supabase } from "@/lib/supabase"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""
  const maxPrice = searchParams.get("maxPrice")
  const budget = maxPrice ? Number(maxPrice) : undefined

  const { data, error } = await supabase
    .from("Teachers")
    .select("id,name,skill,bio,rating,price_hour,category")
    .limit(200)

  if (error) return NextResponse.json({ success: false, error: "DB error" }, { status: 500 })

  const ranked = scoreRecommendation({ query: q, maxPrice: budget, items: (data || []) as any })
  return NextResponse.json({
    success: true,
    query: q,
    inferredCategory: categorizeSkill(q),
    results: ranked.slice(0, 20),
  })
}
