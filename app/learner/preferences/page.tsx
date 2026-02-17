"use client"

import { useEffect, useMemo, useState } from "react"
import { createClientComponentClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Preference = {
  learner_id: string
  skill_level: string | null
  price_sensitivity: number | null
  preferred_categories: string | null // comma-separated for simplicity
}

const ALL_CATEGORIES = ["Math", "Science", "Programming", "Design", "Writing", "Business", "Music", "Language"]

export default function LearnerPreferencesPage() {
  const supabase = useMemo(() => createClientComponentClient(), [])
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [learnerId, setLearnerId] = useState<string | null>(null)
  const [skillLevel, setSkillLevel] = useState<string>("")
  const [priceSensitivity, setPriceSensitivity] = useState<number>(3)
  const [categories, setCategories] = useState<string[]>([])

  // Load current learner and preferences
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser()
        if (userErr) throw userErr
        if (!user) throw new Error("Not authenticated")

        // Find learner row
        const { data: learner, error: lErr } = await supabase
          .from("learners")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle()
        if (lErr) throw lErr
        if (!learner) {
          // Graceful: no learner row yet
          if (!cancelled) setLearnerId(null)
          setLoading(false)
          return
        }
        if (!cancelled) setLearnerId(learner.id)

        // Load preferences
        const { data: pref, error: pErr } = await supabase
          .from("learner_preferences")
          .select("*")
          .eq("learner_id", learner.id)
          .maybeSingle()
        if (pErr) throw pErr

        if (pref) {
          if (!cancelled) {
            setSkillLevel(pref.skill_level || "")
            setPriceSensitivity(typeof pref.price_sensitivity === "number" ? pref.price_sensitivity : 3)
            setCategories(
              pref.preferred_categories
                ? pref.preferred_categories
                    .split(",")
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : [],
            )
          }
        }
      } catch (e: any) {
        console.error("[v0] load preferences error:", e?.message || e)
        toast({ title: "Could not load preferences", description: e?.message || "Try again", variant: "destructive" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [supabase, toast])

  async function onSave() {
    if (!learnerId) {
      toast({
        title: "Profile missing",
        description: "Create a learner profile before saving preferences.",
        variant: "destructive",
      })
      return
    }
    try {
      setSaving(true)
      const payload: Preference = {
        learner_id: learnerId,
        skill_level: skillLevel || null,
        price_sensitivity: priceSensitivity ?? null,
        preferred_categories: categories.length ? categories.join(",") : null,
      }
      const { error } = await supabase.from("learner_preferences").upsert(payload, { onConflict: "learner_id" })
      if (error) throw error
      toast({ title: "Preferences saved" })
    } catch (e: any) {
      console.error("[v0] save preferences error:", e?.message || e)
      toast({ title: "Save failed", description: e?.message || "Try again", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  function toggleCategory(cat: string) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]))
  }

  return (
    <main className="container mx-auto max-w-2xl p-4 md:p-8">
      <Card className="min-h-[60vh]">
        <CardHeader>
          <CardTitle className="text-balance">Learner Preferences</CardTitle>
          <CardDescription>Personalize recommendations and marketplace results.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="h-10 w-full bg-muted rounded" />
              <div className="h-6 w-64 bg-muted rounded" />
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 bg-muted rounded" />
                ))}
              </div>
            </div>
          ) : (
            <>
              <section className="space-y-2">
                <Label htmlFor="skill-level">Skill Level</Label>
                <Input
                  id="skill-level"
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                />
              </section>

              <section className="space-y-2">
                <Label>Price Sensitivity</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[priceSensitivity]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={(v) => setPriceSensitivity(v[0] ?? 3)}
                    className="max-w-sm"
                    aria-label="Price sensitivity"
                  />
                  <span className="text-sm text-muted-foreground">Level {priceSensitivity}</span>
                </div>
              </section>

              <section className="space-y-2">
                <Label>Preferred Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {ALL_CATEGORIES.map((cat) => {
                    const active = categories.includes(cat)
                    return (
                      <button
                        key={cat}
                        className={cn(
                          "px-3 py-1 rounded border text-sm transition-colors",
                          active
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted hover:bg-accent border-transparent",
                        )}
                        onClick={() => toggleCategory(cat)}
                        type="button"
                        aria-pressed={active}
                      >
                        {cat}
                      </button>
                    )
                  })}
                </div>
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.map((c) => (
                      <Badge key={c} variant="secondary">
                        {c}
                      </Badge>
                    ))}
                  </div>
                )}
              </section>

              <div className="pt-2">
                <Button onClick={onSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
