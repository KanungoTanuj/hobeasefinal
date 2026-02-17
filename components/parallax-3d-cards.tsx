"use client"

import { useRef, useEffect, useState, useMemo } from "react"

interface Card3DProps {
  children: React.ReactNode
  delay?: number
  visible?: boolean
}

export function Card3D({ children, delay = 0, visible = true }: Card3DProps) {
  const cardRef = useRef<HTMLDivElement | null>(null)
  const [transform, setTransform] = useState("perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px)")
  const [scrollY, setScrollY] = useState(0)

  const prefersReduced = useMemo(
    () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
    [],
  )

  // Parallax on scroll
  useEffect(() => {
    if (prefersReduced) return

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [prefersReduced])

  // Mouse interaction for tilt
  useEffect(() => {
    if (prefersReduced || !cardRef.current) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return

      const rect = cardRef.current.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2

      const rotateX = ((e.clientY - centerY) / (rect.height / 2)) * 15
      const rotateY = ((centerX - e.clientX) / (rect.width / 2)) * 15

      setTransform(
        `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(20px) translateY(${scrollY * 0.02}px)`,
      )
    }

    const handleMouseLeave = () => {
      setTransform(
        `perspective(1200px) rotateX(0deg) rotateY(0deg) translateZ(0px) translateY(${scrollY * 0.02}px)`,
      )
    }

    const card = cardRef.current
    card.addEventListener("mousemove", handleMouseMove)
    card.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      card.removeEventListener("mousemove", handleMouseMove)
      card.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [scrollY, prefersReduced])

  return (
    <div
      ref={cardRef}
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${delay === 0 ? "delay-0" : delay === 100 ? "delay-100" : "delay-200"}`}
      style={{
        transform,
        transformStyle: "preserve-3d",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  )
}

interface ScrollRevealProps {
  children: React.ReactNode
  threshold?: number
}

export function ScrollReveal({ children, threshold = 0.3 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold },
    )

    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
      }`}
    >
      {children}
    </div>
  )
}
