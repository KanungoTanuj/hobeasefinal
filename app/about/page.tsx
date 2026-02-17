"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users, Target, Heart, Lightbulb, Globe, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import ProfileSection from "@/components/profile-section"
import LanguageSelector from "@/components/language-selector"
import { useTranslation } from "@/components/translation-provider"
import TranslatedText from "@/components/translated-text"
import AuthModal from "@/components/auth-modal"
import HeroSpline from "@/components/hero-spline"
import SectionSplineBackground from "@/components/section-spline-background"
import Parallax3DElements from "@/components/parallax-3d-elements"
import { Card3D, ScrollReveal } from "@/components/parallax-3d-cards"

export default function AboutPage() {
  const [isVisible, setIsVisible] = useState(false)
  const { currentLanguage, setLanguage } = useTranslation()
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  const values = [
    {
      icon: Heart,
      title: "Passion-Driven Learning",
      description: "We believe learning should be driven by genuine interest and passion, not obligation.",
    },
    {
      icon: Users,
      title: "Community First",
      description: "Building connections between learners and teachers creates lasting impact beyond just skills.",
    },
    {
      icon: Globe,
      title: "Accessible to All",
      description: "Democratizing education by making quality learning opportunities available to everyone.",
    },
  ]

  const stats = [
    { number: "10K+", label: "Active Learners" },
    { number: "2K+", label: "Skilled Teachers" },
    { number: "50+", label: "Skill Categories" },
    { number: "95%", label: "Success Rate" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00B9D9] to-[#00A5C7]">
      <Parallax3DElements />
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
            <nav className="hidden md:flex items-center space-x-8">
              <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
              <Link href="/about" className="text-gray-700 hover:text-[#FF6600] transition-colors font-sans">
                <TranslatedText text="About us" />
              </Link>
              <Link href="/signup/teacher" className="text-gray-700 hover:text-[#FF6600] transition-colors font-sans">
                <TranslatedText text="Become a Teacher" />
              </Link>
              <ProfileSection />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section data-hero-section className="relative isolate overflow-hidden">
        {/* Fallback background in case Spline fails to load */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#00B9D9] to-[#00A5C7]" aria-hidden="true" />

        {/* Spline full-bleed background (cursor + scroll motion handled inside) */}
        <HeroSpline
          splineUrl="https://prod.spline.design/UX7GzgEkme8U89FY/scene.splinecode"
          scale={1.4}
          coverBleed={1.25}
          tiltXDeg={6}
          tiltYDeg={8}
          parallaxPx={40}
        />

        {/* Premium legibility scrims (no text shadows) */}
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          aria-hidden="true"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.12) 35%, rgba(0,0,0,0.5))",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          aria-hidden="true"
          style={{
            background: "radial-gradient(1200px 600px at 50% 40%, rgba(0,0,0,0.35), transparent 60%)",
          }}
        />

        {/* Content */}
        <div className="container mx-auto px-4 py-20 relative z-[3]">
          <div
            className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white leading-tight font-serif">
              We're here to unlock potential
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed font-sans">
              ...and foster growth. Welcome to <span className="text-[#FF6600] font-semibold">Hobease</span>, your
              gateway to discovering and nurturing hidden talents and passions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => setShowAuthModal(true)}
                className="bg-[#FF6600] hover:bg-[#FF6600]/90 text-white px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 font-sans"
              >
                <Rocket className="mr-2 h-5 w-5" />
                Start Your Journey
              </Button>
              <Link href="/apply/teacher">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-[#FF6600] px-8 py-6 text-lg rounded-2xl transition-all duration-200 bg-transparent font-sans"
                >
                  <Users className="mr-2 h-5 w-5" />
                  Join as Teacher
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative isolate overflow-hidden py-20 bg-transparent">
        <SectionSplineBackground
          sceneUrl="https://prod.spline.design/4cTjoKcNoBDseEtf/scene.splinecode"
          parallax={0.03}
          tilt={1.0}
          coverScale={1.62}
          variant="blue"
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-8 text-white font-serif">Our Mission</h2>
            <p className="text-lg text-white/90 leading-relaxed mb-12 font-sans">
              Our mission is to democratize hobby and skill development across the world, connecting individuals with untapped skills to those eager to learn and grow. At Hobease, we believe that everyone has unique gifts waiting to be shared and explored.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 justify-center">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className={`text-center transition-all duration-700 ${
                    index === 0 ? "delay-0" : index === 1 ? "delay-100" : index === 2 ? "delay-200" : "delay-300"
                  } ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
                >
                  <div className="text-3xl md:text-4xl font-bold text-[#FF6600] mb-2 font-serif">{stat.number}</div>
                  <div className="text-white/80 font-medium font-sans">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-20 bg-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <ScrollReveal>
              <h2 className="text-4xl font-bold mb-12 text-center text-white font-serif">Our Story</h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <ScrollReveal>
                <div className="space-y-6">
                  <p className="text-lg text-white/80 leading-relaxed font-sans">
                    Hobease was born out of a desire to create a community-driven platform where skills and hobbies are
                    celebrated, shared, and perfected. We understand that in today's fast-paced world, many talents go
                    unnoticed, and many dreams remain unfulfilled.
                  </p>
                  <p className="text-lg text-white/80 leading-relaxed font-sans">
                    Our goal is to bridge this gap by providing a space where skill providers and seekers can come
                    together to learn, teach, and inspire each other.
                  </p>
                </div>
              </ScrollReveal>
              <ScrollReveal threshold={0.4}>
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-[#FF6600]/20 to-[#00B9D9]/20 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-500">
                    <div className="text-center p-8">
                      <div className="transform hover:rotate-12 transition-transform duration-500">
                        <Lightbulb className="h-16 w-16 text-[#FF6600] mx-auto mb-4 drop-shadow-lg" />
                      </div>
                      <h3 className="text-xl font-semibold text-white mb-2 font-serif">Innovation</h3>
                      <p className="text-white/80 font-sans">Transforming how people learn and share skills</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-transparent relative">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <h2 className="text-4xl font-bold mb-12 text-center text-white font-serif">Our Values</h2>
            </ScrollReveal>
            <div className="grid md:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <Card3D key={index} delay={index * 100} visible={isVisible}>
                  <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-500 bg-white/95 hover:bg-white backdrop-blur-sm">
                    <CardContent className="p-8 text-center">
                      <div className="mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#FF6600]/20 to-[#00B9D9]/20 rounded-2xl flex items-center justify-center mx-auto transform group-hover:scale-110 transition-transform">
                          <value.icon className="h-8 w-8 text-[#FF6600]" />
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-4 text-gray-900 font-serif">{value.title}</h3>
                      <p className="text-gray-600 leading-relaxed font-sans">{value.description}</p>
                    </CardContent>
                  </Card>
                </Card3D>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-20 bg-transparent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-4xl font-bold mb-8 text-white font-serif">Our Vision</h2>
            </ScrollReveal>
            <ScrollReveal>
              <p className="text-lg text-white/80 leading-relaxed mb-12 font-sans">
                We envision a world where learning and teaching are not confined to traditional settings. Instead, they
                thrive in a vibrant, peer-to-peer ecosystem where knowledge flows freely, and everyone has the opportunity
                to pursue their passions.
              </p>
            </ScrollReveal>
            <ScrollReveal threshold={0.4}>
              <div className="bg-gradient-to-r from-[#FF6600]/15 via-[#00B9D9]/15 to-[#FF6600]/15 rounded-3xl p-8 md:p-12 backdrop-blur-md border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105">
                <p className="text-xl font-medium text-white mb-6 font-serif">
                  "Whether you're a seasoned expert or a curious beginner, Hobease is here to support your journey."
                </p>
                <div className="flex items-center justify-center gap-2 group">
                  <Target className="h-6 w-6 text-[#FF6600] transform group-hover:rotate-12 transition-transform duration-500" />
                  <span className="text-white/80 font-medium font-sans">Building the future of learning</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#00B9D9] to-[#00A5C7]">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white font-serif">Ready to Join Our Community?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto font-sans">
            Connect with passionate learners and skilled teachers in our growing community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => setShowAuthModal(true)}
              className="bg-white text-[#FF6600] hover:bg-white/90 px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 font-sans"
            >
              <Users className="mr-2 h-5 w-5" />
              Join as Learner
            </Button>
            <Link href="/apply/teacher">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-[#FF6600] px-8 py-6 text-lg rounded-2xl transition-all duration-200 bg-transparent font-sans"
              >
                <Lightbulb className="mr-2 h-5 w-5" />
                Become a Teacher
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <h3 className="text-2xl font-bold text-[#FF6600] mb-4 font-serif">Hobease</h3>
              <p className="text-gray-600 leading-relaxed font-sans">
                Empowering learners worldwide to master new skills and achieve their goals.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 font-serif">Learn</h4>
              <ul className="space-y-2 text-gray-600 font-sans">
                <li>
                  <Link href="/marketplace" className="hover:text-[#FF6600] transition-colors">
                    Browse Skills
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Popular Courses
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Free Resources
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Learning Paths
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 font-serif">Teach</h4>
              <ul className="space-y-2 text-gray-600 font-sans">
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Become a Teacher
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Teaching Resources
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Instructor Support
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Success Stories
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-4 font-serif">Company</h4>
              <ul className="space-y-2 text-gray-600 font-sans">
                <li>
                  <Link href="/about" className="hover:text-[#FF6600] transition-colors">
                    About us
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-[#FF6600] transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600 font-sans">
            <p>© 2024 Hobease. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  )
}
