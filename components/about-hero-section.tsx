"use client"

import Link from "next/link"
import HeroSpline from "@/components/hero-spline"
import { Button } from "@/components/ui/button"

export default function AboutHeroSection() {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#0a2a33] to-[#073a46] shadow-2xl">
      {/* Spline fills entire frame */}
      <HeroSpline
        splineUrl="https://prod.spline.design/UX7GzgEkme8U89FY/scene.splinecode"
        scale={1.1}
        coverBleed={1.25}
        tiltXDeg={5}
        tiltYDeg={6}
        parallaxPx={30}
      />

      {/* Legibility overlays (no text shadow) */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/40" />
        <div className="absolute inset-0 [background:radial-gradient(80%_60%_at_50%_40%,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0)_60%)]" />
      </div>

      {/* Content */}
      <div className="relative z-20 mx-auto flex max-w-5xl flex-col items-center px-6 py-20 text-center md:py-28">
        <h2 className="text-balance font-serif text-4xl font-bold text-white md:text-6xl">
          We&apos;re here to unlock potential
        </h2>
        <p className="mt-5 max-w-2xl text-pretty font-sans text-base leading-relaxed text-white/85 md:text-lg">
          Learn from skilled people around you and share what you know. Grow your passion into progress with Hobease.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link href="/about" className="w-full sm:w-auto">
            <Button size="lg" className="w-full rounded-2xl bg-[#FF6600] px-6 text-white hover:bg-[#ff6a0a]/90">
              Learn more about us
            </Button>
          </Link>
          <Link href="/apply/teacher" className="w-full sm:w-auto">
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-2xl border-white/40 bg-white/10 text-white backdrop-blur hover:bg-white/20"
            >
              Become a teacher
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
