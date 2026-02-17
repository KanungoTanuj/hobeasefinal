"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import {
  Search,
  Users,
  BookOpen,
  ArrowRight,
  Play,
  CheckCircle,
  Menu,
  X,
  Code,
  TrendingUp,
  Palette,
  Camera,
  BarChart3,
  Music,
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import ProfileSection from "@/components/profile-section"
import LanguageSelector from "@/components/language-selector"
import { useTranslation } from "@/components/translation-provider"
import TranslatedText from "@/components/translated-text"
import HeroSpline from "@/components/hero-spline"

const popularSkills = [
  {
    id: 1,
    title: "Web Development",
    description: "Learn HTML, CSS, JavaScript and modern frameworks",
    students: 1250,
    rating: 4.8,
    price: "$49",
    icon: Code,
    iconColor: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-100",
    name: "Web Development",
  },
  {
    id: 2,
    title: "Digital Marketing",
    description: "Master SEO, social media, and online advertising",
    students: 890,
    rating: 4.7,
    price: "$39",
    icon: TrendingUp,
    iconColor: "from-green-500 to-emerald-500",
    bgColor: "bg-green-100",
    name: "Digital Marketing",
  },
  {
    id: 3,
    title: "Graphic Design",
    description: "Create stunning visuals with Adobe Creative Suite",
    students: 675,
    rating: 4.9,
    price: "$59",
    icon: Palette,
    iconColor: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-100",
    name: "Graphic Design",
  },
  {
    id: 4,
    title: "Photography",
    description: "Capture amazing photos and master editing techniques",
    students: 543,
    rating: 4.6,
    price: "$45",
    icon: Camera,
    iconColor: "from-orange-500 to-red-500",
    bgColor: "bg-orange-100",
    name: "Photography",
  },
  {
    id: 5,
    title: "Data Science",
    description: "Analyze data with Python, R and machine learning",
    students: 432,
    rating: 4.8,
    price: "$79",
    icon: BarChart3,
    iconColor: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-100",
    name: "Data Science",
  },
  {
    id: 6,
    title: "Music Production",
    description: "Create beats and produce professional music",
    students: 321,
    rating: 4.5,
    price: "$55",
    icon: Music,
    iconColor: "from-pink-500 to-rose-500",
    bgColor: "bg-pink-100",
    name: "Music Production",
  },
]

const iconMap = {
  Code: Code,
  TrendingUp: TrendingUp,
  Palette: Palette,
  Camera: Camera,
  BarChart3: BarChart3,
  Music: Music,
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [navbarSearchQuery, setNavbarSearchQuery] = useState("")
  const [showNavbarSearch, setShowNavbarSearch] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [touchedCard, setTouchedCard] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [swipeStartX, setSwipeStartX] = useState(0)
  const [swipeEndX, setSwipeEndX] = useState(0)
  const [howItWorksVisible, setHowItWorksVisible] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [touchedStep, setTouchedStep] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const { currentLanguage, setLanguage } = useTranslation()

  const [searchVisible, setSearchVisible] = useState(false)
  const [connectVisible, setConnectVisible] = useState(false)
  const [learnVisible, setLearnVisible] = useState(false)
  const [sequentialAnimationTriggered, setSequentialAnimationTriggered] = useState(false)

  const getCarouselTransform = () => {
    return `translateX(-${currentSlide * 100}%)`
  }

  const getCarouselWidth = () => {
    // Use state-based mobile detection instead of window check
    const totalSlides = isMobile ? popularSkills.length : Math.ceil(popularSkills.length / 2)
    return `${totalSlides * 100}%`
  }

  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768
      if (newIsMobile !== isMobile) {
        setIsMobile(newIsMobile)
        // Reset slide when switching between mobile/desktop
        setCurrentSlide(0)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [isMobile])

  useEffect(() => {
    const handleScroll = () => {
      const heroSection = document.querySelector("[data-hero-section]")
      if (heroSection) {
        const heroBottom = heroSection.getBoundingClientRect().bottom
        setShowNavbarSearch(heroBottom < 100)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      const totalSlides = isMobile ? popularSkills.length : Math.ceil(popularSkills.length / 2)
      setCurrentSlide((prev) => (prev + 1) % totalSlides)
    }, 4000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, isMobile])

  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -10% 0px",
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.hasAttribute("data-skills-section")) {
          setIsVisible(entry.isIntersecting)
        } else if (entry.target.hasAttribute("data-how-it-works-section")) {
          if (entry.isIntersecting && !sequentialAnimationTriggered) {
            setHowItWorksVisible(true)
            setSequentialAnimationTriggered(true)

            // Sequential animation triggers with delays
            setTimeout(() => setSearchVisible(true), 200)
            setTimeout(() => setConnectVisible(true), 600)
            setTimeout(() => setLearnVisible(true), 1000)
          }
        }
      })
    }, observerOptions)

    const skillsSection = document.querySelector("[data-skills-section]")
    const howItWorksSection = document.querySelector("[data-how-it-works-section]")

    if (skillsSection) {
      observer.observe(skillsSection)
    }
    if (howItWorksSection) {
      observer.observe(howItWorksSection)
    }

    return () => observer.disconnect()
  }, [])

  const handleSearch = (e: React.FormEvent, query: string) => {
    e.preventDefault()
    if (query.trim()) {
      window.location.href = `/marketplace?search=${encodeURIComponent(query.trim())}`
    } else {
      window.location.href = "/marketplace"
    }
  }

  const handleNavbarSearch = (e: React.FormEvent) => {
    handleSearch(e, navbarSearchQuery)
  }

  const handleHeroSearch = (e: React.FormEvent) => {
    handleSearch(e, searchQuery)
  }

  const nextSlide = () => {
    const totalSlides =
      typeof window !== "undefined" && window.innerWidth < 768
        ? popularSkills.length
        : Math.ceil(popularSkills.length / 2)
    setCurrentSlide((prev) => (prev + 1) % totalSlides)
  }

  const prevSlide = () => {
    const totalSlides =
      typeof window !== "undefined" && window.innerWidth < 768
        ? popularSkills.length
        : Math.ceil(popularSkills.length / 2)
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)
  }

  const goToSlide = (index: number) => {
    setCurrentSlide(index)
  }

  const handleTouchStart = (e: React.TouchEvent, cardId: number) => {
    setSwipeStartX(e.touches[0].clientX)
    setTouchedCard(cardId)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setSwipeEndX(e.touches[0].clientX)
  }

  const handleTouchEnd = (cardId: number) => {
    const swipeDistance = swipeStartX - swipeEndX
    const minSwipeDistance = 50

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        nextSlide()
      } else {
        prevSlide()
      }
    }

    setTimeout(() => setTouchedCard(null), 600)
  }

  const handleCardTap = (cardId: number) => {
    setTouchedCard(cardId)
    setTimeout(() => setTouchedCard(null), 800)
  }

  const handleStepHover = (stepIndex: number) => {
    setActiveStep(stepIndex)
  }

  const handleStepLeave = () => {
    setActiveStep(null)
  }

  const handleStepTouch = (stepIndex: number) => {
    setTouchedStep(stepIndex)
    setTimeout(() => setTouchedStep(null), 1200)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="hover:opacity-80 transition-opacity">
                <h1 className="text-2xl font-bold font-serif cursor-pointer">
                  <span className="text-[#FF6600]">Hob</span>
                  <span className="text-[#00B9D9]">ease</span>
                </h1>
              </Link>
            </div>

            {showNavbarSearch && (
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <form onSubmit={handleNavbarSearch} className="relative w-full">
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={navbarSearchQuery}
                    onChange={(e) => setNavbarSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] pr-10 font-sans"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#FF6600] transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
              <Link
                href="/about"
                prefetch={false}
                className="text-gray-700 hover:text-[#FF6600] transition-colors font-sans"
              >
                <TranslatedText text="About us" />
              </Link>
              <Link href="/signup/teacher" className="text-gray-700 hover:text-[#FF6600] transition-colors font-sans">
                <TranslatedText text="Become a Teacher" />
              </Link>
              <ProfileSection />
            </nav>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 hover:text-[#FF6600] transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4 space-y-4">
              {showNavbarSearch && (
                <form onSubmit={handleNavbarSearch} className="relative">
                  <input
                    type="text"
                    placeholder="Search skills..."
                    value={navbarSearchQuery}
                    onChange={(e) => setNavbarSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#FF6600]/20 focus:border-[#FF6600] pr-10 font-sans"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#FF6600] transition-colors"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </form>
              )}
              <div className="flex flex-col space-y-3">
                <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
                <Link
                  href="/about"
                  prefetch={false}
                  className="text-gray-700 hover:text-[#FF6600] transition-colors font-sans py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TranslatedText text="About us" />
                </Link>
                <Link
                  href="/signup/teacher"
                  className="text-gray-700 hover:text-[#FF6600] transition-colors font-sans py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <TranslatedText text="Become a Teacher" />
                </Link>
                <div className="pt-2">
                  <ProfileSection onMobileMenuClose={() => setMobileMenuOpen(false)} />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section
        data-hero-section
        className="relative bg-hero-cool rounded-3xl mx-4 sm:mx-6 lg:mx-8 mt-8 overflow-hidden shadow-2xl"
      >
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-white/10 to-[#FFE1CB]/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-48 h-48 bg-gradient-to-br from-[#FFE1CB]/15 to-white/10 rounded-full blur-2xl animate-bounce"></div>
          <div className="absolute bottom-20 left-1/4 w-32 h-32 bg-gradient-to-br from-white/20 to-[#FFE1CB]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-40 right-1/3 w-40 h-40 bg-gradient-to-br from-[#FFE1CB]/20 to-white/15 rounded-full blur-2xl animate-bounce delay-500"></div>
          <div
            className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-br from-white/5 to-[#FFE1CB]/5 rounded-full blur-3xl animate-spin"
            style={{ animationDuration: "20s" }}
          ></div>

          <div className="absolute top-20 left-1/4 w-2 h-2 bg-white/40 rounded-full animate-ping"></div>
          <div className="absolute top-32 right-1/3 w-1 h-1 bg-[#FFE1CB]/60 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-32 left-1/3 w-3 h-3 bg-white/30 rounded-full animate-bounce delay-700"></div>
          <div className="absolute bottom-40 right-1/4 w-1.5 h-1.5 bg-[#FFE1CB]/50 rounded-full animate-ping delay-1000"></div>
          <div className="absolute top-16 left-1/2 w-2.5 h-2.5 bg-white/35 rounded-full animate-pulse delay-500"></div>
          <div className="absolute top-60 left-1/5 w-1 h-1 bg-[#FFE1CB]/45 rounded-full animate-bounce delay-800"></div>
          <div className="absolute bottom-24 right-1/2 w-2 h-2 bg-white/40 rounded-full animate-ping delay-1200"></div>
          <div className="absolute bottom-60 left-2/3 w-1.5 h-1.5 bg-[#FFE1CB]/55 rounded-full animate-pulse delay-400"></div>
          <div className="absolute top-1/3 right-1/5 w-1 h-1 bg-white/50 rounded-full animate-bounce delay-600"></div>
          <div className="absolute top-2/3 left-1/6 w-2 h-2 bg-[#FFE1CB]/40 rounded-full animate-bounce delay-900"></div>
          <div className="absolute bottom-1/3 right-2/3 w-1.5 h-1.5 bg-white/45 rounded-full animate-pulse delay-1100"></div>
          <div className="absolute top-1/4 right-1/6 w-1 h-1 bg-[#FFE1CB]/50 rounded-full animate-bounce delay-200"></div>
          <div className="absolute bottom-1/4 left-1/5 w-2.5 h-2.5 bg-white/35 rounded-full animate-pulse delay-1300"></div>
          <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-[#FFE1CB]/60 rounded-full animate-pulse delay-700"></div>
          <div className="absolute bottom-24 left-3/4 w-2 h-2 bg-white/40 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute top-1/6 left-3/5 w-1.5 h-1.5 bg-[#FFE1CB]/45 rounded-full animate-ping delay-1400"></div>
        </div>

        <HeroSpline
          splineUrl="https://prod.spline.design/gJNZSy4dhIFi4R48/scene.splinecode"
          scale={1.7}
          tiltXDeg={6}
          tiltYDeg={10}
          parallaxPx={48}
          coverBleed={1.25}
        />

        <div className="pointer-events-none absolute inset-0 z-[2]">
          {/* Vertical gradient scrim to boost contrast behind text */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/60"></div>
          {/* Subtle radial vignette to focus center */}
          <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_45%,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.15)_50%,rgba(0,0,0,0.5)_100%)] opacity-80 md:opacity-70"></div>
        </div>

        <div className="container mx-auto px-8 sm:px-12 lg:px-16 py-20 lg:py-32 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight font-serif animate-slideInFromBottom">
              <span className="inline-block animate-slideInFromLeft mr-4" style={{ animationDelay: "200ms" }}>
                <TranslatedText text="Master" as="span" />
              </span>
              <span className="inline-block animate-slideInFromLeft mr-4" style={{ animationDelay: "300ms" }}>
                <TranslatedText text="any" as="span" />
              </span>
              <span
                className="text-[#FFE1CB] inline-block animate-slideInFromRight transform hover:scale-110 hover:rotate-2 transition-all duration-500 mr-2"
                style={{ animationDelay: "400ms" }}
              >
                <TranslatedText text="Skill," as="span" />
              </span>
              <br />
              <span className="inline-block animate-slideInFromLeft mr-4" style={{ animationDelay: "600ms" }}>
                <TranslatedText text="Just" as="span" />
              </span>
              <span
                className="text-[#FFE1CB] inline-block animate-slideInFromRight transform hover:scale-125 hover:-rotate-3 transition-all duration-500 mr-4"
                style={{ animationDelay: "800ms" }}
              >
                <TranslatedText text="100" as="span" />
              </span>
              <span className="inline-block animate-slideInFromBottom" style={{ animationDelay: "1000ms" }}>
                <TranslatedText text="Rupees!" as="span" />
              </span>
            </h1>

            <div className="flex justify-center animate-slideInFromBottom" style={{ animationDelay: "1200ms" }}>
              <form onSubmit={handleHeroSearch} className="relative max-w-2xl w-full group">
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-[#FFE1CB]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 scale-110"></div>
                <div className="absolute -inset-1 bg-gradient-to-r from-white/30 to-[#FFE1CB]/30 rounded-2xl opacity-0 group-focus-within:opacity-100 transition-all duration-500 animate-pulse"></div>

                <input
                  type="text"
                  placeholder="What do you want to learn today?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="relative w-full px-6 py-4 text-lg rounded-2xl border-0 focus:outline-none focus:ring-4 focus:ring-white/30 pr-16 font-sans shadow-lg bg-white/95 backdrop-blur-sm transition-all duration-500 hover:bg-white hover:shadow-2xl hover:scale-105 focus:scale-105 focus:bg-white"
                />

                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-[#FF6600] hover:bg-[#FF6600]/90 text-white p-3 rounded-xl transition-all duration-500 shadow-lg hover:shadow-2xl hover:scale-110 hover:rotate-6 group-hover:animate-pulse"
                >
                  <Search className="h-5 w-5 transition-transform duration-300 group-hover:scale-125" />
                </button>

                {/* Floating particles around search */}
                <div className="absolute -top-2 -left-2 w-1 h-1 bg-white/60 rounded-full animate-ping opacity-0 group-hover:opacity-100"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#FFE1CB]/40 rounded-full animate-bounce opacity-0 group-hover:opacity-100 delay-200"></div>
                <div className="absolute -bottom-2 left-1/4 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse opacity-0 group-hover:opacity-100 delay-400"></div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white relative overflow-hidden" data-how-it-works-section>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-64 h-64 bg-gradient-to-br from-[#FF6600]/5 to-[#FF8533]/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-gradient-to-br from-[#00B9D9]/5 to-[#00A5C7]/5 rounded-full blur-2xl animate-bounce"></div>
          <div className="absolute top-1/2 left-10 w-32 h-32 bg-gradient-to-br from-purple-500/3 to-pink-500/3 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/3 right-10 w-40 h-40 bg-gradient-to-br from-[#FF6600]/5 to-[#FF8533]/5 rounded-full blur-2xl animate-bounce delay-500"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <TranslatedText
              text="How It Works"
              as="h2"
              className={`text-3xl md:text-4xl font-bold text-gray-900 mb-4 font-serif transition-all duration-1000 ${
                howItWorksVisible ? "animate-slideInFromBottom" : "opacity-0 translate-y-10"
              }`}
            />
            <TranslatedText
              text="Getting started is simple. Follow these three easy steps to begin your learning journey."
              as="p"
              className={`text-xl text-gray-600 max-w-2xl mx-auto font-sans transition-all duration-1000 delay-200 ${
                howItWorksVisible ? "animate-slideInFromBottom" : "opacity-0 translate-y-10"
              }`}
            />
          </div>

          <div className="relative max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10 justify-center">
              {[
                {
                  icon: Search,
                  title: "1. Search",
                  description:
                    "Browse through thousands of skills and find the perfect course that matches your interests and goals.",
                  gradient: "from-[#FF6600] to-[#FF8533]",
                  particleColor: "from-[#FF6600] to-[#FF8533]",
                  visible: searchVisible,
                },
                {
                  icon: Users,
                  title: "2. Connect",
                  description:
                    "Connect with experienced teachers who are passionate about sharing their knowledge and expertise.",
                  gradient: "from-[#00B9D9] to-[#00A5C7]",
                  particleColor: "from-[#00B9D9] to-[#00A5C7]",
                  visible: connectVisible,
                },
                {
                  icon: BookOpen,
                  title: "3. Learn",
                  description:
                    "Start learning at your own pace with personalized guidance and hands-on practice sessions.",
                  gradient: "from-purple-500 to-pink-500",
                  particleColor: "from-purple-500 to-pink-500",
                  visible: learnVisible,
                },
              ].map((step, index) => {
                const IconComponent = step.icon
                const isActive = activeStep === index
                const isTouched = touchedStep === index
                const animationDelay = step.visible ? 0 : 0

                return (
                  <div
                    key={index}
                    className={`text-center relative group cursor-pointer transition-all duration-1000 max-w-sm mx-auto ${
                      step.visible ? "animate-slideInFromBottom" : "opacity-0 translate-y-20"
                    }`}
                    style={{ animationDelay: `${animationDelay}ms` }}
                    onMouseEnter={() => handleStepHover(index)}
                    onMouseLeave={handleStepLeave}
                    onClick={() => handleStepTouch(index)}
                  >
                    <div
                      className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
                        isActive || isTouched ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <div
                        className={`absolute top-8 right-8 w-2 h-2 bg-gradient-to-r ${step.particleColor} rounded-full ${
                          isTouched ? "animate-ping scale-150" : "animate-ping"
                        }`}
                      ></div>
                      <div
                        className={`absolute top-16 right-16 w-1 h-1 bg-gradient-to-r ${step.particleColor} rounded-full ${
                          isTouched ? "animate-pulse delay-100 scale-200" : "animate-pulse delay-300"
                        }`}
                      ></div>
                      <div
                        className={`absolute bottom-12 left-8 w-3 h-3 bg-gradient-to-r ${step.particleColor} rounded-full ${
                          isTouched ? "animate-bounce delay-75 scale-125" : "animate-bounce delay-150"
                        }`}
                      ></div>
                      <div
                        className={`absolute bottom-20 left-12 w-1.5 h-1.5 bg-gradient-to-r ${step.particleColor} rounded-full ${
                          isTouched ? "animate-pulse delay-200 scale-150" : "animate-pulse delay-500"
                        }`}
                      ></div>
                      <div
                        className={`absolute top-1/3 left-4 w-2 h-2 bg-gradient-to-r ${step.particleColor} rounded-full ${
                          isTouched ? "animate-bounce delay-300 scale-175" : "animate-bounce delay-700"
                        }`}
                      ></div>
                      {isTouched && (
                        <div className="absolute inset-0 bg-gradient-to-r from-[#FF6600]/20 via-[#00B9D9]/20 to-[#FF6600]/20 animate-pulse rounded-3xl"></div>
                      )}
                    </div>

                    <div
                      className={`relative mx-auto mb-8 transition-all duration-700 ${
                        isActive || isTouched
                          ? "scale-110 -translate-y-4"
                          : "group-hover:scale-105 group-hover:-translate-y-2"
                      }`}
                    >
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${step.gradient} rounded-3xl blur-xl transition-all duration-700 ${
                          isActive || isTouched
                            ? "opacity-40 scale-150"
                            : "opacity-0 group-hover:opacity-20 group-hover:scale-125"
                        }`}
                      ></div>

                      <div
                        className={`relative w-20 h-20 bg-gradient-to-br ${step.gradient} rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-700 overflow-hidden ${
                          isActive || isTouched ? "rotate-12 shadow-3xl" : "group-hover:rotate-6 group-hover:shadow-3xl"
                        }`}
                        style={{ transformStyle: "preserve-3d" }}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-br from-white/30 to-transparent transition-opacity duration-500 ${
                            isActive || isTouched ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        ></div>
                        <IconComponent
                          className={`h-10 w-10 text-white transition-all duration-500 relative z-10 ${
                            isActive || isTouched
                              ? "scale-125 rotate-45"
                              : "group-hover:scale-110 group-hover:rotate-12"
                          }`}
                        />
                        <div
                          className={`absolute inset-0 bg-gradient-to-br from-transparent to-black/10 transition-opacity duration-700 ${
                            isActive || isTouched ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                        ></div>
                      </div>

                      <div
                        className={`absolute inset-0 transition-opacity duration-700 ${
                          isActive || isTouched ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <div
                          className={`absolute top-0 left-1/2 w-3 h-3 bg-gradient-to-r ${step.particleColor} rounded-full -translate-x-1/2 ${
                            isActive || isTouched ? "animate-spin" : ""
                          }`}
                          style={{
                            animation: isActive || isTouched ? "orbit 3s linear infinite" : "none",
                            transformOrigin: "50% 40px",
                          }}
                        ></div>
                      </div>
                    </div>

                    <div
                      className={`transition-all duration-500 ${isActive || isTouched ? "transform scale-105" : ""}`}
                    >
                      <TranslatedText
                        text={step.title}
                        as="h3"
                        className={`text-2xl font-semibold text-gray-900 mb-6 font-serif transition-all duration-500 ${
                          isActive || isTouched
                            ? "text-transparent bg-gradient-to-r bg-clip-text ${step.gradient}"
                            : "group-hover:text-gray-700"
                        }`}
                      />
                      <TranslatedText
                        text={step.description}
                        as="p"
                        className={`text-gray-600 leading-relaxed font-sans transition-all duration-500 ${
                          isActive || isTouched ? "text-gray-700 scale-105" : "group-hover:text-gray-700"
                        }`}
                      />
                    </div>

                    <div
                      className={`absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-gray-200 rounded-full overflow-hidden transition-all duration-700 ${
                        isActive || isTouched ? "w-20 h-2" : ""
                      }`}
                    >
                      <div
                        className={`h-full bg-gradient-to-r ${step.gradient} rounded-full transition-all duration-1000 ${
                          step.visible ? "w-full" : "w-0"
                        }`}
                        style={{ transitionDelay: `200ms` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div
              className={`text-center mt-16 transition-all duration-1000 delay-1000 ${
                howItWorksVisible ? "animate-slideInFromBottom" : "opacity-0 translate-y-10"
              }`}
            >
              <Link href="/marketplace">
                <Button
                  className={`bg-gradient-to-r from-[#FF6600] to-[#FF8533] text-white font-sans px-8 py-4 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:-translate-y-2 group relative overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative z-10">
                    <TranslatedText text="Start Your Journey" />
                  </span>
                  <ArrowRight className="ml-2 h-5 w-5 relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <style jsx>{`
          @keyframes orbit {
            from {
              transform: rotate(0deg) translateX(40px) rotate(0deg);
            }
            to {
              transform: rotate(360deg) translateX(40px) rotate(-360deg);
            }
          }

          /* remove component-scoped text-shadow (was weaker) to let global .text-shadow-hero win */
          /* (Intentionally left empty to avoid overriding global utility) */
        `}</style>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-[#FF6600] to-[#FF8533] text-white shadow-inner">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-48 h-48 bg-gradient-to-br from-white/10 to-[#FFE1CB]/15 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-32 right-16 w-32 h-32 bg-gradient-to-br from-[#FFE1CB]/20 to-white/10 rounded-full blur-2xl animate-bounce"></div>
          <div className="absolute bottom-16 left-1/4 w-40 h-40 bg-gradient-to-br from-white/15 to-[#FFE1CB]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-32 right-1/3 w-24 h-24 bg-gradient-to-br from-[#FFE1CB]/25 to-white/15 rounded-full blur-2xl animate-bounce delay-500"></div>

          {/* Floating particles */}
          <div className="absolute top-20 left-1/3 w-2 h-2 bg-white/30 rounded-full animate-ping"></div>
          <div className="absolute top-40 right-1/4 w-1 h-1 bg-[#FFE1CB]/40 rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-24 left-1/2 w-3 h-3 bg-white/20 rounded-full animate-bounce delay-700"></div>
          <div className="absolute bottom-40 right-1/5 w-1.5 h-1.5 bg-[#FFE1CB]/35 rounded-full animate-ping delay-1000"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <TranslatedText
              text="Ready to Start Learning?"
              as="h2"
              className="text-3xl md:text-4xl font-bold mb-6 font-serif animate-slideInFromBottom"
            />
            <TranslatedText
              text="Join thousands of learners who are already mastering new skills and advancing their careers with Hobease."
              as="p"
              className="text-xl mb-8 opacity-90 max-w-2xl mx-auto leading-relaxed font-sans animate-slideInFromBottom"
              style={{ animationDelay: "200ms" }}
            />

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center animate-slideInFromBottom"
              style={{ animationDelay: "400ms" }}
            >
              <Link href="/auth">
                <Button
                  size="lg"
                  variant="secondary"
                  className="group relative text-lg px-8 py-6 font-sans bg-[#00B9D9] text-white hover:bg-[#00B9D9]/90 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:-translate-y-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-[#00B9D9] to-[#00A5C7] rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

                  <Play className="mr-2 h-5 w-5 relative z-10 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                  <span className="relative z-10">
                    <TranslatedText text="Start Learning Today" />
                  </span>

                  {/* Button particles */}
                  <div className="absolute top-1 right-2 w-1 h-1 bg-white/60 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                  <div className="absolute bottom-2 left-3 w-1.5 h-1.5 bg-white/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce delay-200"></div>
                </Button>
              </Link>

              <Link href="/signup/teacher">
                <Button
                  size="lg"
                  variant="outline"
                  className="group relative text-lg px-8 py-6 border-2 border-white text-white hover:bg-white hover:text-[#FF6600] bg-transparent font-sans rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 hover:scale-110 hover:-translate-y-2 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute -inset-1 bg-gradient-to-r from-white/50 to-white/30 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>

                  <CheckCircle className="mr-2 h-5 w-5 relative z-10 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12" />
                  <span className="relative z-10">
                    <TranslatedText text="Become an Instructor" />
                  </span>

                  {/* Button particles */}
                  <div className="absolute top-2 right-1 w-1 h-1 bg-[#FF6600]/60 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></div>
                  <div className="absolute bottom-1 left-2 w-1.5 h-1.5 bg-[#FF6600]/40 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-bounce delay-300"></div>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 shadow-sm relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden opacity-50">
          <div className="absolute top-10 left-1/4 w-32 h-32 bg-gradient-to-br from-[#FF6600]/5 to-[#FF8533]/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-1/4 w-24 h-24 bg-gradient-to-br from-[#00B9D9]/5 to-[#00A5C7]/5 rounded-full blur-2xl animate-bounce"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 relative z-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1 animate-slideInFromLeft">
              <h3 className="text-2xl font-bold text-[#FF6600] mb-4 font-serif hover:scale-105 transition-transform duration-300">
                Hobease
              </h3>
              <TranslatedText
                text="Empowering learners worldwide to master new skills and achieve their goals."
                as="p"
                className="text-gray-600 leading-relaxed font-sans"
              />
            </div>

            <div className="animate-slideInFromBottom" style={{ animationDelay: "200ms" }}>
              <TranslatedText
                text="Learn"
                as="h4"
                className="font-semibold text-gray-900 mb-4 font-serif hover:text-[#FF6600] transition-colors duration-300"
              />
              <ul className="space-y-2 text-gray-600 font-sans">
                <li>
                  <Link
                    href="/marketplace"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Browse Skills" />
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Popular Courses" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Free Resources" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Learning Paths" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="animate-slideInFromBottom" style={{ animationDelay: "400ms" }}>
              <TranslatedText
                text="Teach"
                as="h4"
                className="font-semibold text-gray-900 mb-4 font-serif hover:text-[#FF6600] transition-colors duration-300"
              />
              <ul className="space-y-2 text-gray-600 font-sans">
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Become a Teacher" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Teaching Resources" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Instructor Support" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Success Stories" />
                  </a>
                </li>
              </ul>
            </div>

            <div className="animate-slideInFromRight" style={{ animationDelay: "600ms" }}>
              <TranslatedText
                text="Company"
                as="h4"
                className="font-semibold text-gray-900 mb-4 font-serif hover:text-[#FF6600] transition-colors duration-300"
              />
              <ul className="space-y-2 text-gray-600 font-sans">
                <li>
                  <Link href="/about" prefetch={false} className="hover:text-[#FF6600] transition-colors">
                    <TranslatedText text="About us" />
                  </Link>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Contact" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Privacy Policy" />
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-[#FF6600] transition-all duration-300 hover:translate-x-2 inline-block"
                  >
                    <TranslatedText text="Terms of Service" />
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div
            className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600 font-sans animate-slideInFromBottom"
            style={{ animationDelay: "800ms" }}
          >
            <TranslatedText
              text="© 2024 Hobease. All rights reserved."
              as="p"
              className="hover:text-[#FF6600] transition-colors duration-300"
            />
          </div>
        </div>
      </footer>
    </div>
  )
}
