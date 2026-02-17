"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"

const Spline = dynamic(() => import("@splinetool/react-spline"), { ssr: false })

type MissionSplineProps = {
  splineUrl: string
  // visual tuning
  scale?: number
  maxTiltDeg?: number
}

export default function MissionSpline({ splineUrl, scale = 1.1, maxTiltDeg = 4 }: MissionSplineProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const rafRef = useRef<number | null>(null)
  const [inView, setInView] = useState(false)

  // Lazy mount only when in view
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting) setInView(true)
      },
      { rootMargin: "200px 0px", threshold: 0.15 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Lightweight tilt tied to the section only (no window listeners)
  useEffect(() => {
    const el = rootRef.current
    if (!el || !innerRef.current) return
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (prefersReduced) return

    let tX = 0,
      tY = 0
    let rX = 0,
      rY = 0

    const onPointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2 // -1..1
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2
      tY = nx * maxTiltDeg
      tX = -ny * maxTiltDeg
    }

    const animate = () => {
      rX += (tX - rX) * 0.08
      rY += (tY - rY) * 0.08
      if (innerRef.current) {
        innerRef.current.style.transform = `rotateX(${rX.toFixed(2)}deg) rotateY(${rY.toFixed(2)}deg) scale(${scale})`
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    el.addEventListener("pointermove", onPointerMove, { passive: true })
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      el.removeEventListener("pointermove", onPointerMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [maxTiltDeg, scale])

  return (
    <div
      ref={rootRef}
      className="relative overflow-hidden rounded-3xl h-[260px] md:h-[360px] bg-gradient-to-br from-[#00B9D9]/15 to-[#00A5C7]/15 ring-1 ring-black/5"
      aria-hidden="true"
    >
      {/* Full-bleed canvas wrapper */}
      <div
        ref={innerRef}
        className="absolute inset-0 pointer-events-none"
        style={{ transformStyle: "preserve-3d", willChange: "transform", transformOrigin: "50% 50%" }}
      >
        {inView ? (
          <div data-spline-mission className="absolute inset-0">
            <Spline scene={splineUrl} />
          </div>
        ) : null}
      </div>

      {/* Soft, premium scrim for readability */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(900px 420px at 50% 60%, rgba(0,0,0,0.18), transparent 60%)" }}
      />

      <style jsx global>{`
        [data-spline-mission],
        [data-spline-mission] > canvas,
        [data-spline-mission] > div,
        [data-spline-mission] * {
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
