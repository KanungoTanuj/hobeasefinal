"use client"

import { useEffect, useRef, useState, useMemo } from "react"

interface FloatingElement {
  id: number
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  size: number
  rotation: number
  rotationSpeed: number
  opacity: number
  color: string
}

export default function Parallax3DElements() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [elements, setElements] = useState<FloatingElement[]>([])
  const animationRef = useRef<number | null>(null)
  const scrollY = useRef(0)

  const prefersReduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  )

  // Initialize floating elements
  useEffect(() => {
    const colors = ["#FF6600", "#00B9D9", "#00A5C7", "#FF8C42", "#00D9FF"]
    const newElements: FloatingElement[] = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      z: Math.random() * 100 - 50,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.2,
      size: Math.random() * 40 + 20,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 2,
      opacity: Math.random() * 0.5 + 0.3,
      color: colors[i % colors.length],
    }))
    setElements(newElements)
  }, [])

  // Handle scroll for parallax
  useEffect(() => {
    const handleScroll = () => {
      scrollY.current = window.scrollY
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Animation loop
  useEffect(() => {
    if (prefersReduced || !containerRef.current) return

    const animate = () => {
      setElements((prev) =>
        prev.map((el) => {
          let nx = el.x + el.vx
          let ny = el.y + el.vy
          let nz = el.z + el.vz

          // Bounce off edges
          if (nx < 0 || nx > 100) {
            return { ...el, vx: -el.vx, x: Math.max(0, Math.min(100, nx)) }
          }
          if (ny < 0 || ny > 100) {
            return { ...el, vy: -el.vy, y: Math.max(0, Math.min(100, ny)) }
          }
          if (nz < -50 || nz > 50) {
            return { ...el, vz: -el.vz, z: Math.max(-50, Math.min(50, nz)) }
          }

          return {
            ...el,
            x: nx,
            y: ny,
            z: nz,
            rotation: el.rotation + el.rotationSpeed,
          }
        }),
      )
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [prefersReduced])

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ perspective: "1200px", zIndex: -5 }}
    >
      {elements.map((el) => {
        const scale = 1 + el.z / 100
        const opacity = Math.max(0.1, el.opacity * (1 - Math.abs(el.z) / 50))
        const parallax = scrollY.current * 0.05 * (1 - scale)

        return (
          <div
            key={el.id}
            className="absolute rounded-lg backdrop-blur-sm"
            style={{
              left: `${el.x}%`,
              top: `${el.y}%`,
              transform: `
                translate3d(-50%, calc(-50% + ${parallax}px), ${el.z * 10}px)
                rotateX(${el.rotation * 0.5}deg)
                rotateY(${el.rotation}deg)
                rotateZ(${el.rotation * 0.3}deg)
                scale(${scale})
              `,
              width: `${el.size}px`,
              height: `${el.size}px`,
              backgroundColor: el.color,
              opacity,
              boxShadow: `0 8px 32px ${el.color}40, inset 0 1px 0 rgba(255,255,255,0.2)`,
              transition: "none",
            }}
          >
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent" />
          </div>
        )
      })}
    </div>
  )
}
