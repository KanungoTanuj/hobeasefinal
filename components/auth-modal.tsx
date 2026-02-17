"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { X, Check } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const slides = [
    {
      title: "Learn from other skilled people!",
      benefits: [
        "Connect with expert tutors",
        "Learn at your own pace",
        "Get personalized guidance",
        "Join a community of learners",
      ],
    },
    {
      title: "Sign up now to join the club of Happy Learners",
      benefits: [
        "Access to premium courses",
        "1-on-1 mentoring sessions",
        "Interactive learning tools",
        "Certificate upon completion",
      ],
    },
    {
      title: "Start your learning journey today!",
      benefits: [
        "Flexible scheduling options",
        "Affordable pricing plans",
        "24/7 learning support",
        "Progress tracking tools",
      ],
    },
  ]

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [slides.length])

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError("")

    const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-hobeaselanding12.vercel.app/auth/callback"
    console.log("[v0] Google OAuth redirect URL:", redirectUrl)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
      },
    })

    if (error) {
      setError(error.message)
    }
    setLoading(false)
  }

  const handleEmailContinue = () => {
    setShowEmailForm(true)
    setError("")
    setMessage("")
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setMessage("")

    if (isSignUp) {
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://v0-hobeaselanding12.vercel.app/auth/callback"
      console.log("[v0] Email signup redirect URL:", redirectUrl)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: redirectUrl,
        },
      })

      if (error) {
        if (error.message.includes("User already registered")) {
          setError("An account with this email already exists. Please sign in instead.")
          setTimeout(() => {
            setIsSignUp(false)
            setError("")
          }, 2000)
        } else {
          setError(error.message)
        }
      } else {
        if (data.user && !data.user.email_confirmed_at) {
          setMessage(`✅ Account created! We've sent a verification email to ${email}. 
          
          📧 Check your inbox (and spam folder) for the verification link.
          
          ⚠️ If the email link doesn't work, try using Google sign-in instead (recommended).
          
          💡 The verification link should redirect you back to this site automatically.
          
          🔧 Debug: Using redirect URL: ${redirectUrl}`)
        } else {
          setMessage("Account created successfully!")
          setTimeout(() => onClose(), 1500)
        }
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError(`❌ Invalid email or password. 
          
          💡 If you just signed up, please check your email for the verification link first.
          
          🔄 Alternatively, try signing up again or use Google sign-in.`)
        } else if (error.message.includes("Email not confirmed")) {
          setError(`📧 Please verify your email first. Check your inbox for the verification link.
          
          💡 Can't find the email? Try Google sign-in instead.`)
        } else {
          setError(error.message)
        }
      } else {
        setMessage("Signed in successfully!")
        setTimeout(() => onClose(), 1000)
      }
    }
    setLoading(false)
  }

  const switchMode = () => {
    setIsSignUp(!isSignUp)
    setError("")
    setMessage("")
  }

  const goBackToSocial = () => {
    setShowEmailForm(false)
    setError("")
    setMessage("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[600px] p-0 bg-transparent border-none shadow-none">
        <div className="flex h-full bg-white/95 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl border border-gray-200/50 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 hover:bg-gray-100/80 rounded-full transition-all duration-200 hover:shadow-md backdrop-blur-sm"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>

          {/* Left Carousel Section */}
          <div className="w-1/2 bg-gradient-to-br from-[#FF6600] via-[#FF7A1A] to-[#FF8533] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5"></div>
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center text-white max-w-md">
                <h2 className="text-xl font-bold mb-3 font-serif text-white leading-tight">
                  {slides[currentSlide].title}
                </h2>
                <div className="space-y-1.5 mb-5">
                  {slides[currentSlide].benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-white">
                      <Check className="h-3.5 w-3.5 text-white bg-white/20 rounded-full p-0.5 flex-shrink-0" />
                      <span className="text-xs font-medium leading-relaxed">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Carousel Controls */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentSlide ? "bg-white shadow-lg" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Right Auth Section */}
          <div className="w-1/2 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 via-white/80 to-gray-50/20"></div>
            <div className="relative z-10 h-full overflow-y-auto p-8">
              <div className="flex flex-col justify-center min-h-full">
                <div className="max-w-sm mx-auto w-full">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Get Started</h3>

                  {!showEmailForm ? (
                    <>
                      <p className="text-sm text-gray-600 mb-6">
                        {isSignUp ? "Create your account" : "Sign in to your account"}
                      </p>

                      {/* Social Login Buttons */}
                      <div className="space-y-3 mb-6">
                        <Button
                          onClick={handleGoogleSignIn}
                          disabled={loading}
                          className="w-full h-12 bg-white border border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-lg hover:shadow-gray-200/30 flex items-center justify-center gap-3 rounded-2xl shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-gray-300"
                        >
                          <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Continue with Google
                        </Button>

                        <Button
                          onClick={handleEmailContinue}
                          className="w-full h-12 bg-white border border-gray-200 text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:shadow-lg hover:shadow-gray-200/30 flex items-center justify-center gap-3 rounded-2xl shadow-sm transition-all duration-300 hover:scale-[1.02] hover:border-gray-300"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V7l8 5 8-5v2z" />
                          </svg>
                          Continue with Email
                        </Button>
                      </div>

                      {/* Bottom Toggle */}
                      <p className="text-sm text-gray-600 mt-2 text-center">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button onClick={switchMode} className="text-[#FF6600] hover:underline font-medium">
                          {isSignUp ? "Sign in" : "Sign up"}
                        </button>
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-6">
                        <button
                          onClick={goBackToSocial}
                          className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                          ← Back
                        </button>
                        <p className="text-sm text-gray-600">
                          {isSignUp ? "Create account with email" : "Sign in with email"}
                        </p>
                      </div>

                      {/* Email Form */}
                      <form onSubmit={handleEmailAuth} className="space-y-4">
                        {isSignUp && (
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF6600]/20 focus:border-[#FF6600] transition-all duration-200 bg-white/80 backdrop-blur-sm hover:shadow-md hover:border-gray-300"
                            required
                          />
                        )}
                        <input
                          type="email"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF6600]/20 focus:border-[#FF6600] transition-all duration-200 bg-white/80 backdrop-blur-sm hover:shadow-md hover:border-gray-300"
                          required
                        />
                        <input
                          type="password"
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-[#FF6600]/20 focus:border-[#FF6600] transition-all duration-200 bg-white/80 backdrop-blur-sm hover:shadow-md hover:border-gray-300"
                          required
                        />
                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full h-12 bg-gradient-to-r from-[#FF6600] to-[#FF7A1A] hover:from-[#FF7A1A] hover:to-[#FF6600] text-white rounded-2xl shadow-lg hover:shadow-xl hover:shadow-orange-200/40 transition-all duration-300 hover:scale-[1.02]"
                        >
                          {loading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
                        </Button>
                      </form>

                      <p className="text-sm text-gray-600 mt-4 text-center">
                        {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                        <button onClick={switchMode} className="text-[#FF6600] hover:underline font-medium">
                          {isSignUp ? "Sign in" : "Sign up"}
                        </button>
                      </p>
                    </>
                  )}

                  {/* Error/Success Messages */}
                  {error && (
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl">
                      <div className="text-sm text-red-600 whitespace-pre-line leading-relaxed">{error}</div>
                    </div>
                  )}
                  {message && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-2xl">
                      <div className="text-sm text-green-600 whitespace-pre-line leading-relaxed">{message}</div>
                    </div>
                  )}

                  {/* Terms */}
                  <p className="text-xs text-gray-500 mt-6 text-center leading-relaxed">
                    By proceeding, you agree to Hobease's{" "}
                    <a href="#" className="text-[#FF6600] hover:underline">
                      Privacy Policy
                    </a>
                    ,{" "}
                    <a href="#" className="text-[#FF6600] hover:underline">
                      User Agreement
                    </a>{" "}
                    and{" "}
                    <a href="#" className="text-[#FF6600] hover:underline">
                      T&Cs
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
