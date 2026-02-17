"use client"

import * as React from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { useToast } from "@/hooks/use-toast"

type Props = {
  bookingId: string
  teacherId: string
  learnerId: string
  onRated?: () => void
}

export function RateBookingDialog({ bookingId, teacherId, learnerId, onRated }: Props) {
  const supabase = React.useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    [],
  )
  const { toast } = useToast()

  const [open, setOpen] = React.useState(false)
  const [rating, setRating] = React.useState(5)
  const [comment, setComment] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  async function submit() {
    try {
      setSubmitting(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Insert rating; RLS ensures learner owns this booking
      const { error } = await supabase.from("teacher_ratings").insert({
        booking_id: bookingId,
        teacher_id: teacherId,
        learner_id: learnerId,
        rating,
        comment: comment || null,
      })
      if (error) throw error
      toast({ title: "Thanks for your rating!" })
      setOpen(false)
      onRated?.()
    } catch (e: any) {
      console.error("[v0] rating error:", e?.message || e)
      toast({ title: "Could not submit rating", description: e?.message || "Try again", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Rate</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate your session</DialogTitle>
          <DialogDescription>Share quick feedback with a 1–5 rating and a short note.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rating</Label>
            <div className="flex items-center gap-4">
              <Slider
                value={[rating]}
                min={1}
                max={5}
                step={1}
                onValueChange={(v) => setRating(v[0] ?? 5)}
                className="max-w-sm"
              />
              <span className="text-sm text-muted-foreground">{rating} / 5</span>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comment (optional)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What went well? What could improve?"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
