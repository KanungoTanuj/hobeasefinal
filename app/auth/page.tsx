"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, RefreshCw } from "lucide-react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

export default function AuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isResending, setIsResending] = useState(false)
  const [resendEmail, setResendEmail] = useState("")
  const [signInData, setSignInData] = useState({ email: "", password: "" })
  const [signUpData, setSignUpData] = useState({ name: "", email: "", password: "", confirmPassword: "" })

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")
    const errorCode = searchParams.get("error_code")

    if (error) {
      if (error === "access_denied" && errorCode === "otp_expired") {
        setError("Email verification link has expired. Please request a new verification email below.")
      } else if (errorDescription) {
        setError(decodeURIComponent(errorDescription))
      } else {
        setError("Authentication error occurred. Please try again.")
      }
    }

    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        router.push("/")
      }
    }

    checkAuth()
  }, [searchParams, router])

  const handleResendVerification = async () => {
    if (!resendEmail) {
      setError("Please enter your email address to resend verification")
      return
    }

    setIsResending(true)
    setError("")
    setMessage("")

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: resendEmail,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage("Verification email sent! Please check your inbox.")
      }
    } catch (err) {
      setError("Failed to resend verification email")
    } finally {
      setIsResending(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email,
        password: signInData.password,
      })

      if (error) {
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("Email not confirmed") ||
          error.message.includes("User not found")
        ) {
          // Check if it's likely an unregistered email vs wrong password
          if (signInData.password.length > 0) {
            setError(
              `No account found with email "${signInData.email}". Please sign up first or check your email address.`,
            )
            setTimeout(() => {
              const signUpTab = document.querySelector('[value="signup"]') as HTMLButtonElement
              if (signUpTab) {
                signUpTab.click()
                setSignUpData((prev) => ({ ...prev, email: signInData.email }))
              }
            }, 2000)
          } else {
            setError(error.message)
          }
        } else {
          setError(error.message)
        }
      } else {
        setMessage("Successfully signed in! Redirecting...")
        setTimeout(() => {
          window.location.href = "/"
        }, 1500)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setMessage("")

    if (signUpData.password !== signUpData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (signUpData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            name: signUpData.name,
          },
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        setError(error.message)
      } else {
        setMessage(`Account created successfully! Please check your email to verify your account.

📧 Check your inbox and spam folder for the verification email.

⚠️ Not receiving emails? This could be due to:
• Email service configuration in Supabase
• Your email provider blocking the emails
• Incorrect email address

💡 Try using Google sign-in as an alternative, or contact support if the issue persists.`)
        setResendEmail(signUpData.email)
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTabChange = (value: string) => {
    setError("")
    setMessage("")
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-[#FF6600] mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <Link href="/" className="block">
            <h1 className="text-3xl font-bold font-serif">
              <span className="text-[#FF6600]">Hob</span>
              <span className="text-[#00B9D9]">ease</span>
            </h1>
          </Link>
          <p className="mt-2 text-gray-600 font-sans">Welcome back! Please sign in to your account</p>
        </div>

        {/* Auth Card */}
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center font-serif">Authentication</CardTitle>
            <CardDescription className="text-center font-sans">
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full" onValueChange={handleTabChange}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin" className="font-sans">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="font-sans">
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* Messages */}
              {message && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800 font-sans">{message}</AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800 font-sans">{error}</AlertDescription>
                </Alert>
              )}

              {/* Resend Verification Section */}
              {error.includes("expired") && (
                <Card className="mb-4 border-yellow-200 bg-yellow-50">
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <p className="text-sm text-yellow-800 font-sans">Need a new verification email?</p>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          placeholder="Enter your email"
                          value={resendEmail}
                          onChange={(e) => setResendEmail(e.target.value)}
                          className="flex-1 text-sm"
                        />
                        <Button
                          onClick={handleResendVerification}
                          disabled={isResending}
                          size="sm"
                          variant="outline"
                          className="whitespace-nowrap bg-transparent"
                        >
                          {isResending ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            "Resend"
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sign In Tab */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="font-sans">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signInData.email}
                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        className="pl-10 font-sans"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="font-sans">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        className="pl-10 pr-10 font-sans"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90 font-sans"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="font-sans">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                        className="pl-10 font-sans"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="font-sans">
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="Enter your email"
                        value={signUpData.email}
                        onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                        className="pl-10 font-sans"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="font-sans">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        className="pl-10 pr-10 font-sans"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="font-sans">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="signup-confirm-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirm your password"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        className="pl-10 font-sans"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90 font-sans"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 font-sans">
          <p>
            By signing up, you agree to our{" "}
            <a href="#" className="text-[#FF6600] hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-[#FF6600] hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
