// lib/ai.ts
// Free AI helpers with optional OpenRouter integration

type Category = "Music" | "Coding" | "Fitness" | "Art" | "Language" | "Academics" | "Business" | "Other"

const CATEGORY_KEYWORDS: Record<Category, string[]> = {
  Music: ["music", "guitar", "piano", "singing", "violin", "drums", "vocal", "flute", "ukulele", "songwriting", "dj"],
  Coding: [
    "coding",
    "programming",
    "web",
    "app",
    "react",
    "next",
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "ml",
    "ai",
    "data",
    "dsa",
    "devops",
  ],
  Fitness: [
    "fitness",
    "gym",
    "yoga",
    "workout",
    "calisthenics",
    "running",
    "diet",
    "nutrition",
    "training",
    "martial",
    "boxing",
    "zumba",
    "pilates",
  ],
  Art: [
    "art",
    "drawing",
    "painting",
    "sketch",
    "illustration",
    "design",
    "photoshop",
    "figma",
    "video",
    "editing",
    "dance",
    "photography",
    "pottery",
  ],
  Language: ["english", "hindi", "spanish", "french", "german", "mandarin", "language", "ielts", "toefl", "spoken"],
  Academics: [
    "math",
    "physics",
    "chemistry",
    "biology",
    "science",
    "accounting",
    "economics",
    "history",
    "geography",
    "exam",
    "jee",
    "neet",
    "board",
  ],
  Business: [
    "marketing",
    "finance",
    "sales",
    "excel",
    "powerbi",
    "tableau",
    "analytics",
    "entrepreneurship",
    "startup",
    "management",
    "pm",
    "product",
  ],
  Other: [],
}

export function categorizeSkill(input: string): Category {
  const text = (input || "").toLowerCase()
  let best: { cat: Category; score: number } = { cat: "Other", score: 0 }
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS) as [Category, string[]][]) {
    const score = words.reduce((s, w) => s + (text.includes(w) ? 1 : 0), 0)
    if (score > best.score) best = { cat, score }
  }
  return best.cat
}

function textToVector(text: string): Map<string, number> {
  const tokens = (text || "")
    .toLowerCase()
    .split(/[^a-z0-9#+]+/)
    .filter(Boolean)
  const map = new Map<string, number>()
  for (const t of tokens) map.set(t, (map.get(t) || 0) + 1)
  return map
}

export function cosineSim(a: string, b: string): number {
  const va = textToVector(a),
    vb = textToVector(b)
  let dot = 0,
    na = 0,
    nb = 0
  for (const [k, v] of va) {
    na += v * v
    if (vb.has(k)) dot += v * (vb.get(k) || 0)
  }
  for (const v of vb.values()) nb += v * v
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom ? dot / denom : 0
}

// Optional LLM via OpenRouter
async function openRouterChat(prompt: string): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) return null
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-70b-instruct:free",
        messages: [
          { role: "system", content: "You are a helpful tutor assistant for Hobease." },
          { role: "user", content: prompt },
        ],
      }),
    })
    const data = await res.json()
    return data?.choices?.[0]?.message?.content || null
  } catch {
    return null
  }
}

export async function generateProfile(opts: {
  name: string
  skill: string
  experience?: string
  style?: "friendly" | "professional"
}): Promise<string> {
  const base = `Write a short tutor bio. Name: ${opts.name}, Skill: ${opts.skill}, Experience: ${opts.experience || "not specified"}, Tone: ${opts.style || "friendly"}.`
  const llm = await openRouterChat(base)
  if (llm) return llm.trim()
  return `${opts.name} teaches ${opts.skill}. ${opts.experience ? "With " + opts.experience + " experience," : ""} I focus on clear fundamentals and tailored lessons to keep learning fun.`
}

export type TeacherLike = {
  id?: string | number
  name: string
  skill: string
  bio?: string
  rating?: number
  price_hour?: number
  category?: string
}

export function scoreRecommendation(params: { query: string; maxPrice?: number; items: TeacherLike[] }) {
  const qcat = categorizeSkill(params.query)
  return params.items
    .map((it) => {
      let score = 0,
        reasons: string[] = []
      const sim = cosineSim(params.query, `${it.name} ${it.skill} ${it.bio || ""}`)
      score += sim * 5
      if (sim > 0.2) reasons.push("matches your query")
      if (params.maxPrice && it.price_hour && it.price_hour <= params.maxPrice) {
        score += 2
        reasons.push("within budget")
      }
      const cat = it.category || categorizeSkill(it.skill || "")
      if (cat === qcat) {
        score += 1
        reasons.push(`category: ${cat}`)
      }
      if (it.rating) score += (it.rating / 5) * 1.5
      return { item: it, score, reasons }
    })
    .sort((a, b) => b.score - a.score)
}
