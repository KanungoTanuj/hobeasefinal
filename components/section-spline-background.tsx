"use client"

import { useEffect, useMemo, useRef, useState } from "react"

type SectionSplineBackgroundProps = {
  sceneUrl: string
  parallax?: number
  tilt?: number
  coverScale?: number
  // light = white scrim (keeps section looking white), dark = dark scrims
  // blue = blue blend variant that blends with About page blue background
  variant?: "light" | "dark" | "blue"
}

export default function SectionSplineBackground({
  sceneUrl,
  parallax = 0.04,
  tilt = 1.25,
  coverScale = 1.12,
  variant = "light",
}: SectionSplineBackgroundProps) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const layerRef = useRef<HTMLDivElement | null>(null)
  const viewerMountRef = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)

  const prefersReduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  )

  // Lazy-register the web component & mount only when near viewport
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setInView(true)
        }
      },
      { rootMargin: "200px" },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Mount the <spline-viewer> web component when in view
  useEffect(() => {
    if (!inView || !viewerMountRef.current) return

    let disposed = false
    ;(async () => {
      try {
        // Registers the <spline-viewer> custom element
        await import("@splinetool/viewer")
        if (disposed) return
        // Create and attach the viewer element programmatically to avoid TSX typing issues
        const viewer = document.createElement("spline-viewer")
        viewer.setAttribute("url", sceneUrl)
        viewer.setAttribute("touch-action", "none")
        viewer.style.width = "100%"
        viewer.style.height = "100%"
        viewer.style.display = "block"
        // Ensure the internal canvas fills the frame
        ;(viewer as any).loading = "auto"
        viewerMountRef.current!.innerHTML = ""
        viewerMountRef.current!.appendChild(viewer)
      } catch {
        // silently fail; the section has a visual fallback via overlays
      }
    })()

    return () => {
      disposed = true
      if (viewerMountRef.current) viewerMountRef.current.innerHTML = ""
    }
  }, [inView, sceneUrl])

  // Single RAF for tilt + parallax (no React state updates)
  useEffect(() => {
    if (prefersReduced) return
    const el = rootRef.current
    const layer = layerRef.current
    if (!el || !layer) return

    let raf = 0
    let running = true
    let px = 0
    let py = 0
    let scrollY = typeof window !== "undefined" ? window.scrollY : 0

    const onPointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      px = ((e.clientX - rect.left) / rect.width) * 2 - 1
      py = ((e.clientY - rect.top) / rect.height) * 2 - 1
    }
    const onScroll = () => {
      scrollY = window.scrollY
    }

    el.addEventListener("pointermove", onPointer, { passive: true })
    window.addEventListener("scroll", onScroll, { passive: true })

    const loop = () => {
      if (!running) return
      const rx = -(py * tilt)
      const ry = px * tilt
      const ty = -(scrollY * parallax)
      layer.style.transform = `translate3d(0, ${ty}px, 0) rotateX(${rx}deg) rotateY(${ry}deg) scale(${coverScale})`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onVisibility = () => {
      running = document.visibilityState !== "hidden"
      if (running) raf = requestAnimationFrame(loop)
      else cancelAnimationFrame(raf)
    }
    document.addEventListener("visibilitychange", onVisibility)

    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener("pointermove", onPointer as any)
      window.removeEventListener("scroll", onScroll as any)
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [parallax, tilt, coverScale, prefersReduced])

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div ref={layerRef} className="absolute inset-0 will-change-transform" style={{ transformOrigin: "center" }}>
        <div ref={viewerMountRef} className="absolute inset-0" />
      </div>

      {/* Legibility overlays */}
      {variant === "light" ? (
        <>
          {/* keep the section visually white while allowing subtle depth */}
          <div aria-hidden className="absolute inset-0 bg-white/85" />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(70% 60% at 50% 50%, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.04) 45%, rgba(0,0,0,0) 100%)",
            }}
          />
        </>
      ) : variant === "dark" ? (
        <>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/45" />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 50%, rgba(0,0,0,.30) 0%, rgba(0,0,0,0.12) 45%, rgba(0,0,0,0) 100%)",
            }}
          />
        </>
      ) : (
        <>
          {/* Blue blend variant: tints the Spline to brand blues and
              adds top/bottom edge fades to remove the visible cut between sections */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, rgba(0,185,217,0.85) 0%, rgba(0,165,199,0.85) 100%)",
            }}
          />
          {/* soft vignette for depth while keeping copy legible */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 50%, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 45%, rgba(0,0,0,0) 100%)",
            }}
          />
          {/* top edge blend into page blue */}
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[18vh] md:h-[22vh]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(0,169,200,1) 0%, rgba(0,169,200,0.85) 35%, rgba(0,169,200,0) 100%)",
            }}
          />
          {/* bottom edge blend into page blue */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[18vh] md:h-[22vh]"
            style={{
              background:
                "linear-gradient(to top, rgba(0,169,200,1) 0%, rgba(0,169,200,0.85) 35%, rgba(0,169,200,0) 100%)",
            }}
          />
        </>
      )}
    </div>
  )
}
