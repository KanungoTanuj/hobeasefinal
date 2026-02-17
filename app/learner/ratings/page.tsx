"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase" // use shared client with safe fallbacks
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { RateBookingDialog } from "@/components/rate-booking-dialog"
import { useToast } from "@/hooks/use-toast"

type Booking = {
  id: string
  teacher_id: string
  learner_id: string
  status: string
  teacher_name: string | null
  booking_date: string | null
}

export default function LearnerRatingsPage() {
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Find this learner row
        const { data: learner, error: lErr } = await supabase
          .from("learners")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle()
        if (lErr) throw lErr
        if (!learner) {
          setBookings([])
          setLoading(false)
          return
        }

        // Completed bookings for this learner
        const { data: completed, error: cErr } = await supabase
          .from("bookings")
          .select("id, teacher_id, learner_id, status, teacher_name, booking_date")
          .eq("learner_id", learner.id)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
        if (cErr) throw cErr

        // Filter out those already rated
        const ids = (completed || []).map((b) => b.id)
        let unrated = completed || []
        if (ids.length) {
          const { data: rated, error: rErr } = await supabase
            .from("teacher_ratings")
            .select("booking_id")
            .in("booking_id", ids)
          if (rErr) throw rErr
          const ratedSet = new Set((rated || []).map((r) => r.booking_id))
          unrated = (completed || []).filter((b) => !ratedSet.has(b.id))
        }

        if (!cancelled) setBookings(unrated as any)
      } catch (e: any) {
        console.error("[v0] load ratings page error:", e?.message || e)
        toast({ title: "Could not load ratings", description: e?.message || "Try again", variant: "destructive" })
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [toast, refreshKey])

  return (
    <main className="container mx-auto max-w-3xl p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-balance">Rate Your Sessions</CardTitle>
          <CardDescription>Leave feedback for recently completed bookings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-8 w-64 bg-muted rounded" />
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No unrated completed bookings right now.</p>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded border p-3">
                  <div className="space-y-1">
                    <p className="font-medium">{b.teacher_name || "Your teacher"}</p>
                    {b.booking_date ? (
                      <p className="text-xs text-muted-foreground">Completed on {b.booking_date}</p>
                    ) : null}
                  </div>
                  <RateBookingDialog
                    bookingId={b.id}
                    teacherId={b.teacher_id}
                    learnerId={b.learner_id}
                    onRated={() => setRefreshKey((k) => k + 1)}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
