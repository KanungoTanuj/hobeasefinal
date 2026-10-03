"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Loader2, Sparkles, Users, Video } from "lucide-react"
import HobeaseLogo from "@/components/hobease-logo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const interests = [
  { value: "learn", label: "Learn", description: "Find your next skill" },
  { value: "teach", label: "Teach", description: "Share what you know" },
  { value: "both", label: "Both", description: "Learn and teach" },
] as const

type Interest = (typeof interests)[number]["value"]

export default function ComingSoonPage() {
  const [form, setForm] = useState({ name: "", email: "", interest: "learn" as Interest })
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const scrollToWaitlist = () => document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth", block: "center" })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (status === "loading") return
    setStatus("loading")
    setMessage("")
    try {
      const response = await fetch("/api/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
      const data = (await response.json().catch(() => ({}))) as { error?: string; message?: string }
      if (!response.ok) throw new Error(data.error || data.message || "Please try again.")
      setStatus("success")
      setMessage(data.message || "You’re on the list.")
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Please try again.")
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#fffaf5] text-[#192b35]">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-12">
        <HobeaseLogo textClassName="text-[1.75rem] font-bold tracking-[-0.06em]" />
        <div className="flex items-center gap-3">
          <Link href="/auth" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#192b35] transition hover:bg-white sm:inline-flex">Log in</Link>
          <Button onClick={scrollToWaitlist} className="rounded-full bg-[#ff6600] px-5 font-semibold text-white shadow-[0_10px_24px_-12px_#ff6600] hover:bg-[#e85c00]">Join the waitlist</Button>
        </div>
      </nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-12 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12 lg:pb-28 lg:pt-20">
        <div className="relative z-10 max-w-2xl">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#ff6600]/20 bg-white/80 px-4 py-2 text-sm font-semibold text-[#b94a00] shadow-sm"><Sparkles className="size-4" /> Coming soon to your screen</div>
          <h1 className="font-serif text-[clamp(3.4rem,8vw,7.4rem)] font-bold leading-[.94] tracking-[-0.075em] text-[#173542]">Learn what you love.<br /><span className="text-[#ff6600]">From people</span><br />who know it.</h1>
          <p className="mt-8 max-w-xl text-lg leading-8 text-[#53707a] sm:text-xl">Hobease connects curious people with people who love to teach. Learn practical skills, explore new hobbies, and grow one real conversation at a time.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button onClick={scrollToWaitlist} size="lg" className="h-14 rounded-full bg-[#ff6600] px-7 text-base font-bold text-white shadow-[0_18px_35px_-18px_#ff6600] hover:bg-[#e85c00]">Get early access <ArrowRight data-icon="inline-end" /></Button>
            <Button asChild size="lg" variant="outline" className="h-14 rounded-full border-[#c9e8ed] bg-white/70 px-7 text-base font-bold text-[#173542] hover:bg-white"><Link href="/signup/teacher">Become a teacher <ArrowRight data-icon="inline-end" /></Link></Button>
          </div>
          <p className="mt-5 text-sm text-[#6e858b]">Private sessions start at ₹100/hour · Group sessions where available</p>
        </div>
        <div className="relative min-h-[390px] lg:min-h-[520px]">
          <div className="absolute right-0 top-5 size-56 rounded-full bg-[#c9f3f4] blur-2xl sm:size-80" />
          <div className="absolute bottom-0 left-0 size-44 rounded-full bg-[#ffe0c6] blur-2xl sm:size-64" />
          <div className="absolute inset-x-4 top-7 rotate-3 rounded-[2.5rem] border border-white/80 bg-white/70 p-4 shadow-[0_30px_80px_-35px_#245462] backdrop-blur sm:inset-x-10 sm:p-6">
            <div className="rounded-[1.9rem] bg-[#e7f8f7] p-6 sm:p-8"><div className="flex items-start justify-between"><span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#00a4b7]">LIVE LEARNING</span><Sparkles className="size-5 text-[#ff6600]" aria-hidden="true" /></div><div className="mt-20 max-w-xs"><p className="text-sm font-semibold text-[#00a4b7]">One-to-one, your way</p><p className="mt-2 font-serif text-3xl font-bold leading-tight text-[#173542]">Make space for a skill that feels like you.</p></div></div>
          </div>
          <div className="absolute bottom-3 right-2 flex w-56 -rotate-6 items-center gap-3 rounded-2xl border border-white bg-white p-4 shadow-xl sm:bottom-7 sm:right-0"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0e5] text-[#ff6600]"><Video className="size-5" /></div><div><p className="text-sm font-bold">Meet your mentor</p><p className="text-xs text-[#6e858b]">A better way to learn</p></div></div>
        </div>
      </section>

      <section className="border-y border-[#d9eeee] bg-[#edfbfa] px-5 py-16 sm:px-8 lg:px-12"><div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-3"><div className="flex gap-4"><Users className="mt-1 size-6 text-[#00a4b7]" /><div><h2 className="font-serif text-xl font-bold">People, not platforms</h2><p className="mt-2 text-sm leading-6 text-[#53707a]">Learn directly from someone who has been there.</p></div></div><div className="flex gap-4"><Sparkles className="mt-1 size-6 text-[#ff6600]" /><div><h2 className="font-serif text-xl font-bold">Skills with personality</h2><p className="mt-2 text-sm leading-6 text-[#53707a]">Find lessons that fit your pace and your curiosity.</p></div></div><div className="flex gap-4"><Check className="mt-1 size-6 text-[#00a4b7]" /><div><h2 className="font-serif text-xl font-bold">Start small, go far</h2><p className="mt-2 text-sm leading-6 text-[#53707a]">Affordable sessions that make trying something new easy.</p></div></div></div></section>

      <section id="waitlist" className="scroll-mt-8 px-5 py-20 sm:px-8 lg:px-12 lg:py-28"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-sm font-bold uppercase tracking-[.2em] text-[#ff6600]">Be first in</p><h2 className="mt-4 font-serif text-5xl font-bold leading-tight tracking-[-0.05em] text-[#173542] sm:text-6xl">Your next chapter starts here.</h2><p className="mt-5 max-w-md text-lg leading-8 text-[#53707a]">Leave your details and we’ll let you know when Hobease opens its doors. No passwords. No noise.</p></div><div className="rounded-[2rem] border border-[#d9eeee] bg-white p-6 shadow-[0_25px_70px_-35px_#245462] sm:p-9"><form onSubmit={handleSubmit} className="flex flex-col gap-5" aria-describedby={message ? "waitlist-message" : undefined}><div><Label htmlFor="waitlist-name" className="text-sm font-semibold">Your name</Label><Input id="waitlist-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={120} className="mt-2 h-12 rounded-xl border-[#d9eeee] bg-[#fbfefe]" placeholder="What should we call you?" /></div><div><Label htmlFor="waitlist-email" className="text-sm font-semibold">Email address</Label><Input id="waitlist-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required maxLength={320} className="mt-2 h-12 rounded-xl border-[#d9eeee] bg-[#fbfefe]" placeholder="you@example.com" /></div><fieldset><legend className="text-sm font-semibold">I’m here to…</legend><div className="mt-2 grid grid-cols-3 gap-2">{interests.map((interest) => <button key={interest.value} type="button" onClick={() => setForm({ ...form, interest: interest.value })} aria-pressed={form.interest === interest.value} className={`rounded-xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6600] ${form.interest === interest.value ? "border-[#ff6600] bg-[#fff0e5] text-[#b94a00]" : "border-[#d9eeee] hover:border-[#9bdbe2]"}`}><span className="block text-sm font-bold">{interest.label}</span><span className="mt-1 block text-[11px] text-[#6e858b]">{interest.description}</span></button>)}</div></fieldset><Button type="submit" disabled={status === "loading" || status === "success"} className="h-13 rounded-xl bg-[#173542] text-base font-bold text-white hover:bg-[#245462]">{status === "loading" ? <><Loader2 className="animate-spin" /> Saving your spot…</> : status === "success" ? <><Check /> You’re on the list</> : <>Join the waitlist <ArrowRight data-icon="inline-end" /></>}</Button>{message && <p id="waitlist-message" role={status === "error" ? "alert" : "status"} className={`text-sm leading-6 ${status === "error" ? "text-destructive" : "text-[#00a4b7]"}`}>{message}</p>}</form></div></div></section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-[#d9eeee] px-5 py-8 text-sm text-[#6e858b] sm:flex-row sm:px-12"><HobeaseLogo textClassName="text-xl font-bold tracking-[-0.06em]" /><p>Learning is better together.</p></footer>
    </main>
  )
}
