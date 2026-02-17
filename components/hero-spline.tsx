"use client"

import { useEffect, useRef } from "react"
import Spline from "@splinetool/react-spline"

type HeroSplineProps = {
  splineUrl: string
  // Optional: zoom in/out the model
  scale?: number
  // Optional: max tilt in degrees
  tiltXDeg?: number
  tiltYDeg?: number
  // Optional: max parallax translate in px
  parallaxPx?: number
  coverBleed?: number
}

export default function HeroSpline({
  splineUrl,
  scale = 1.6,
  tiltXDeg = 6,
  tiltYDeg = 8,
  parallaxPx = 40,
  coverBleed = 1.2,
}: HeroSplineProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const heroEl = document.querySelector("[data-hero-section]") as HTMLElement | null
    if (!heroEl || !innerRef.current) return

    let rotX = 0
    let rotY = 0
    let targetRotX = 0
    let targetRotY = 0
    let parallaxY = 0
    let targetParallaxY = 0

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isMobile = window.matchMedia("(max-width: 767px)").matches

    const onMouseMove = (e: MouseEvent) => {
      if (isMobile) return
      const { innerWidth, innerHeight } = window
      const nx = (e.clientX / innerWidth - 0.5) * 2 // -1..1
      const ny = (e.clientY / innerHeight - 0.5) * 2 // -1..1
      // Subtle tilt using props
      targetRotY = nx * tiltYDeg // rotateY left/right
      targetRotX = -ny * tiltXDeg // rotateX up/down
    }

    const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

    const onScroll = () => {
      if (!heroEl) return
      const rect = heroEl.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // Normalize center distance of hero to viewport center: -1..1
      const centerOffset = rect.top + rect.height / 2 - vh / 2
      const normalized = clamp(centerOffset / (vh / 2), -1, 1)
      // Map to px translate for subtle parallax using props
      targetParallaxY = -normalized * parallaxPx
    }

    const animate = () => {
      // Lerp toward targets for smoothness
      rotX += (targetRotX - rotX) * 0.08
      rotY += (targetRotY - rotY) * 0.08
      parallaxY += (targetParallaxY - parallaxY) * 0.08

      if (innerRef.current) {
        const finalScale = (scale ?? 1) * (coverBleed ?? 1)
        innerRef.current.style.transform =
          `translate3d(0, ${parallaxY.toFixed(2)}px, 0) ` +
          `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) ` +
          `scale3d(${finalScale}, ${finalScale}, ${finalScale})`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    // Initial compute and listeners
    onScroll()
    if (!prefersReduced) {
      window.addEventListener("mousemove", onMouseMove, { passive: true })
      window.addEventListener("scroll", onScroll, { passive: true })
      rafRef.current = requestAnimationFrame(animate)
    }

    return () => {
      window.removeEventListener("mousemove", onMouseMove as any)
      window.removeEventListener("scroll", onScroll as any)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [scale, tiltXDeg, tiltYDeg, parallaxPx, coverBleed])

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0 z-[1] pointer-events-none"
      style={{
        perspective: "1000px",
        transformStyle: "preserve-3d",
        contain: "layout paint size",
      }}
      aria-hidden="true"
    >
      <div
        ref={innerRef}
        className="w-full h-full"
        style={{ transformStyle: "preserve-3d", willChange: "transform", transformOrigin: "50% 50%" }}
      >
        {/* Note: pointer-events are disabled so hero UI remains clickable */}
        <div data-spline-canvas className="absolute inset-0 pointer-events-none">
          <Spline scene={splineUrl} />
        </div>
      </div>

      <style jsx global>{`
        /* Force the internal Spline canvas to fully cover its container */
        [data-spline-canvas],
        [data-spline-canvas] > canvas,
        [data-spline-canvas] > div,
        [data-spline-canvas] * {
          width: 100% !important;
          height: 100% !important;
          max-width: none !important;
          max-height: none !important;
          display: block;
        }
      `}</style>
    </div>
  )
}
