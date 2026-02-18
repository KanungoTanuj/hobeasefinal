"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  BookOpen,
  CreditCard,
  TrendingUp,
  Heart,
  Calendar,
  Clock,
  IndianRupee,
  Loader2,
  MessageSquare,
  Settings,
  Star,
  Video,
  Bell,
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { ChatInterface } from "@/components/chat-interface"
import { VideoCallInterface } from "@/components/video-call-interface"
import { useIsMobile } from "@/hooks/use-mobile"

interface Learner {
  id: string // Changed from number to string for UUID
  name: string
  email: string
  wishlist: string[]
}

interface Booking {
  id: string
  teacher_id: string // Changed from number to string for UUID
  booking_date: string
  booking_time: string
  status: string
  learner_name: string
  learner_email: string
  teacher_name: string
  teacher_skill: string
  price_per_hour: number
  created_at: string
  updated_at: string
  teacher: {
    name: string
    skill: string
    photo_url: string | null
    price_hour: number
  }
}

interface ProgressData {
  teacher_skill: string
  sessions: number
}

interface TeacherSkillView {
  teacher_id: string // Changed from number to string for UUID
  teacher_name: string
  skill_name: string
  teacher_photo: string | null
  price_per_hour: number
  skill_id: string
  skill_category: string
  proficiency_level: string
  skill_years_experience: number
}

export default function LearnerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [learner, setLearner] = useState<Learner | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [wishlistTeachers, setWishlistTeachers] = useState<TeacherSkillView[]>([])
  const [progressData, setProgressData] = useState<ProgressData[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<Booking | null>(null)
  const [selectedBookingForCall, setSelectedBookingForCall] = useState<Booking | null>(null)
  const [activeClassId, setActiveClassId] = useState<string | null>(null)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)
  const [classStatuses, setClassStatuses] = useState<{ [key: string]: boolean }>({})
  const [unreadByBooking, setUnreadByBooking] = useState<{ [key: string]: number }>({})
  const isMobile = useIsMobile()

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth")
      return
    }

    setUser(user)
    await fetchLearnerData(user.email!)
  }

  const fetchLearnerData = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log("[v0] Starting fetchLearnerData for email:", email)

      const { data: learnerData, error: learnerError } = await supabase
        .from("learners")
        .select("*")
        .eq("email", email)
        .order("id", { ascending: false })
        .limit(1)
        .single()

      console.log("[v0] Learner query result:", { data: learnerData, error: learnerError })

      if (learnerError && learnerError.code !== "PGRST116") {
        throw learnerError
      }

      if (learnerData) {
        console.log("[v0] Raw learner data:", learnerData)
        console.log("[v0] Raw wishlist value:", learnerData.wishlist)
        console.log("[v0] Wishlist type:", typeof learnerData.wishlist)

        let wishlistArray = []
        try {
          if (learnerData.wishlist) {
            if (typeof learnerData.wishlist === "string") {
              wishlistArray = JSON.parse(learnerData.wishlist)
              console.log("[v0] Parsed wishlist from string:", wishlistArray)
            } else if (Array.isArray(learnerData.wishlist)) {
              wishlistArray = learnerData.wishlist
              console.log("[v0] Wishlist is already array:", wishlistArray)
            } else {
              console.log("[v0] Unexpected wishlist type:", typeof learnerData.wishlist, learnerData.wishlist)
            }
          }
        } catch (parseError) {
          console.log("[v0] JSON parse error:", parseError)
          wishlistArray = []
        }

        console.log("[v0] Final wishlist array:", wishlistArray)
        console.log("[v0] Wishlist array length:", wishlistArray.length)
        console.log(
          "[v0] Wishlist array types:",
          wishlistArray.map((id: any) => typeof id),
        )

        setLearner({
          ...learnerData,
          wishlist: wishlistArray,
        })

        // Fetch wishlist teachers
        if (wishlistArray.length > 0) {
          console.log("[v0] Skill IDs for query:", wishlistArray)

          const { data: skillsData, error: skillsError } = await supabase
            .from("teacher_skills_view")
            .select("*")
            .in("skill_id", wishlistArray)

          console.log("[v0] Skills query result:", skillsData)
          console.log("[v0] Skills query error:", skillsError)

          if (!skillsError && skillsData) {
            const transformedTeachers = skillsData.map((skill: any) => ({
              id: skill.teacher_id,
              name: skill.teacher_name,
              skill: skill.skill_name,
              photo_url: skill.teacher_photo,
              price_hour: skill.price_per_hour,
              skillId: skill.skill_id,
              category: skill.skill_category,
              proficiency: skill.proficiency_level,
              experience: skill.skill_years_experience,
            }))
            setWishlistTeachers(transformedTeachers)
            console.log("[v0] Set wishlist teachers:", transformedTeachers.length, "teachers")
          } else {
            console.log("[v0] Failed to fetch skills:", skillsError)
            setWishlistTeachers([])
          }
        } else {
          console.log("[v0] No wishlist items, setting empty array")
          setWishlistTeachers([])
        }
      } else {
        console.log("[v0] No learner data found")
        setWishlistTeachers([])
      }

      // Fetch bookings with teacher details
      console.log("[v0] Fetching bookings for email:", email)
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(`
          *,
          teacher:Teachers(name, skill, photo_url, price_hour)
        `)
        .eq("learner_email", email)
        .order("booking_date", { ascending: false })

      console.log("[v0] Bookings query result:", { data: bookingsData, error: bookingsError })
      console.log("[v0] Number of bookings found:", bookingsData?.length || 0)
      if (bookingsData && bookingsData.length > 0) {
        console.log(
          "[v0] Booking statuses:",
          bookingsData.map((b) => ({ id: b.id, status: b.status })),
        )
      }

      if (!bookingsError && bookingsData) {
        setBookings(bookingsData as Booking[])

        // Calculate total spent
        const completed = bookingsData.filter((b) => b.status === "completed")
        const total = completed.reduce((sum, booking) => sum + (booking.price_per_hour || 0), 0)
        setTotalSpent(total)

        // Calculate progress data
        const skillSessions: { [key: string]: number } = {}
        completed.forEach((booking) => {
          const skill = booking.teacher_skill || "Other"
          skillSessions[skill] = (skillSessions[skill] || 0) + 1
        })

        const progress = Object.entries(skillSessions).map(([skill, sessions]) => ({
          teacher_skill: skill,
          sessions,
        }))
        setProgressData(progress)
      }
    } catch (err) {
      console.error("[v0] Error fetching learner data:", err)
      setError("Failed to load dashboard data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const removeFromWishlist = async (skillId: string) => {
    if (!learner) return

    const newWishlist = learner.wishlist.filter((id) => id !== skillId)

    try {
      const { error } = await supabase
        .from("learners")
        .update({ wishlist: JSON.stringify(newWishlist) })
        .eq("email", learner.email)
        .eq("id", learner.id)

      if (!error) {
        setLearner({ ...learner, wishlist: newWishlist })
        setWishlistTeachers((prev) => prev.filter((t) => t.skillId !== skillId))
      }
    } catch (err) {
      console.error("[v0] Error removing from wishlist:", err)
    }
  }

  const checkClassStatus = async (bookingId: string) => {
    try {
      console.log("[v0] Checking class status for booking:", bookingId)
      const response = await fetch(`/api/classes/status?bookingId=${bookingId}`)

      console.log("[v0] Status check response:", response.status, response.statusText)

      if (!response.ok) {
        console.error("[v0] Failed to check status:", response.status)
        return false
      }

      const data = await response.json()
      console.log("[v0] Class status data:", data)
      return data.active
    } catch (error) {
      console.error("[v0] Error checking class status:", error)
      return false
    }
  }

  const handleJoinClass = async (booking: Booking) => {
    try {
      const response = await fetch("/api/classes/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || "Failed to join class. The teacher may not have started the class yet.")
        return
      }

      const data = await response.json()
      setActiveClassId(data.classId)
      setActiveRoomId(data.roomId)
      setSelectedBookingForCall(booking)
      setIsVideoCallOpen(true)
    } catch (error) {
      console.error("[v0] Error joining class:", error)
      alert("Failed to join class. Please try again.")
    }
  }

  const handleCallEnd = () => {
    setIsVideoCallOpen(false)
    setSelectedBookingForCall(null)
    setActiveClassId(null)
    setActiveRoomId(null)
  }

  useEffect(() => {
    const checkStatuses = async () => {
      const confirmedBookings = bookings.filter((b) => b.status === "confirmed")
      console.log("[v0] Checking statuses for", confirmedBookings.length, "confirmed bookings")
      const statuses: { [key: string]: boolean } = {}

      for (const booking of confirmedBookings) {
        const isActive = await checkClassStatus(booking.id)
        console.log("[v0] Booking", booking.id, "active status:", isActive)
        statuses[booking.id] = isActive
      }

      console.log("[v0] Updated class statuses:", statuses)
      setClassStatuses(statuses)
    }

    if (bookings.length > 0) {
      checkStatuses()
      const interval = setInterval(checkStatuses, 10000)
      return () => clearInterval(interval)
    }
  }, [bookings])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      try {
        const response = await fetch("/api/messages/unread")
        if (response.ok) {
          const data = await response.json()
          setUnreadByBooking(data.unreadByBooking || {})
        }
      } catch (error) {
        console.error("[v0] Error fetching unread messages:", error)
      }
    }

    fetchUnreadMessages()
    const interval = setInterval(fetchUnreadMessages, 10000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
          <span className="text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => fetchLearnerData(user?.email || "")} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  const upcomingBookings = bookings.filter((b) => b.status === "confirmed" || b.status === "pending")
  const completedBookings = bookings.filter((b) => b.status === "completed")

  console.log("[v0] Total bookings:", bookings.length)
  console.log("[v0] Upcoming bookings (pending + confirmed):", upcomingBookings.length)
  console.log("[v0] Completed bookings:", completedBookings.length)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
              </Button>
              <div className="h-6 w-px bg-border hidden sm:block" />
              <h1 className="text-lg sm:text-xl font-bold">Learner Dashboard</h1>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Quick links to Preferences and Ratings */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/learner/preferences")}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferences</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/learner/ratings")}
                className="flex items-center space-x-1 sm:space-x-2"
              >
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">Ratings</span>
              </Button>
              {/* existing status badge */}
              <Badge
                variant="secondary"
                className="bg-[#00B9D9]/10 text-[#00B9D9] border-[#00B9D9]/20 text-xs sm:text-sm"
              >
                <span className="sm:hidden">Active</span>
                <span className="hidden sm:inline">Active Learner</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Profile Section */}
          <div className="mb-6 sm:mb-8">
            <Card>
              <CardHeader className="pb-4 sm:pb-6">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                    <AvatarImage src="/student-avatar.png" />
                    <AvatarFallback className="bg-[#FF6600] text-white text-base sm:text-lg">
                      {learner?.name?.charAt(0) || user?.email?.charAt(0) || "L"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">
                      {learner?.name || user?.user_metadata?.full_name || "Learner"}
                    </CardTitle>
                    <p className="text-muted-foreground text-sm sm:text-base">{learner?.email || user?.email}</p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* Dashboard Tabs */}
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            {isMobile ? (
              <TabsList className="grid w-full grid-cols-2 h-auto">
                <TabsTrigger value="overview" className="flex flex-col items-center space-y-1 py-3">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="bookings" className="flex flex-col items-center space-y-1 py-3">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs">Tutors</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex flex-col items-center space-y-1 py-3">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs">Payments</span>
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="flex flex-col items-center space-y-1 py-3">
                  <Heart className="h-4 w-4" />
                  <span className="text-xs">Wishlist</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex flex-col items-center space-y-1 py-3">
                  <Settings className="h-4 w-4" />
                  <span className="text-xs">Settings</span>
                </TabsTrigger>
              </TabsList>
            ) : (
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="bookings" className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>My Tutors</span>
                </TabsTrigger>
                <TabsTrigger value="payments" className="flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Payments</span>
                </TabsTrigger>
                <TabsTrigger value="wishlist" className="flex items-center space-x-2">
                  <Heart className="h-4 w-4" />
                  <span>Wishlist</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </TabsTrigger>
              </TabsList>
            )}

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#FF6600]">{completedBookings.length}</div>
                    <p className="text-xs text-muted-foreground">Completed sessions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-[#00B9D9]">₹{totalSpent}</div>
                    <p className="text-xs text-muted-foreground">On completed sessions</p>
                  </CardContent>
                </Card>

                <Card className="sm:col-span-2 lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Upcoming Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{upcomingBookings.length}</div>
                    <p className="text-xs text-muted-foreground">Confirmed bookings</p>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Tracker */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Learning Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {progressData.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {progressData.map((progress) => (
                        <div key={progress.teacher_skill} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-2 h-2 bg-[#FF6600] rounded-full flex-shrink-0" />
                            <span className="font-medium text-sm sm:text-base">{progress.teacher_skill}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {progress.sessions} session{progress.sessions !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                      No completed sessions yet. Book your first session to start tracking progress!
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings" className="space-y-4 sm:space-y-6">
              {selectedBookingForChat ? (
                <div className="max-w-4xl mx-auto">
                  <ChatInterface
                    booking={selectedBookingForChat}
                    currentUserId={user?.id || ""}
                    currentUserRole="learner"
                    currentUserEmail={user?.email || ""}
                    onClose={() => setSelectedBookingForChat(null)}
                  />
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {/* Upcoming Sessions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {upcomingBookings.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {upcomingBookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 border rounded-lg"
                            >
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                  <AvatarImage
                                    src={
                                      booking.teacher?.photo_url || "/placeholder.svg?height=40&width=40&query=teacher"
                                    }
                                  />
                                  <AvatarFallback>{booking.teacher_name?.charAt(0) || "T"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium text-sm sm:text-base">{booking.teacher_name}</p>
                                  <p className="text-sm text-muted-foreground">{booking.teacher_skill}</p>
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-xs text-muted-foreground mt-1 space-y-1 sm:space-y-0">
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="h-3 w-3" />
                                      <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{booking.booking_time}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2">
                                <div>
                                  <p className="font-medium text-[#FF6600] text-sm sm:text-base">
                                    ₹{booking.price_per_hour}
                                  </p>
                                  <Badge variant="secondary" className="text-xs">
                                    {booking.status === "confirmed" ? "Confirmed" : "Pending"}
                                  </Badge>
                                </div>
                                <div className="flex gap-2">
                                  {(booking.status === "confirmed" || booking.status === "pending") && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        if (booking.status === "pending") {
                                          alert(
                                            "This booking needs to be confirmed first. Please wait for teacher confirmation.",
                                          )
                                          return
                                        }
                                        if (!classStatuses[booking.id]) {
                                          alert(
                                            "The teacher hasn't started the class yet. Please wait for them to start.",
                                          )
                                          return
                                        }
                                        handleJoinClass(booking)
                                      }}
                                      disabled={booking.status === "pending" || !classStatuses[booking.id]}
                                      className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                      title={
                                        booking.status === "pending"
                                          ? "Waiting for confirmation"
                                          : !classStatuses[booking.id]
                                            ? "Waiting for teacher to start"
                                            : "Join video class"
                                      }
                                    >
                                      <Video className="h-3 w-3 mr-1" />
                                      {booking.status === "pending"
                                        ? "Join Class (Pending)"
                                        : classStatuses[booking.id]
                                          ? "Join Class"
                                          : "Join Class (Not Started)"}
                                    </Button>
                                  )}
                                  {(booking.status === "confirmed" ||
                                    booking.status === "pending" ||
                                    booking.status === "completed") && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedBookingForChat(booking)}
                                      className="text-xs relative"
                                    >
                                      <MessageSquare className="h-3 w-3 mr-1" />
                                      Chat
                                      {unreadByBooking[booking.id] && unreadByBooking[booking.id] > 0 && (
                                        <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-xs">
                                          {unreadByBooking[booking.id]}
                                        </Badge>
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                          No upcoming sessions
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Session History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Session History</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {completedBookings.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                          {completedBookings.slice(0, 5).map((booking) => (
                            <div
                              key={booking.id}
                              className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 p-3 sm:p-4 border rounded-lg"
                            >
                              <div className="flex items-center space-x-3 sm:space-x-4">
                                <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                  <AvatarImage
                                    src={
                                      booking.teacher?.photo_url || "/placeholder.svg?height=40&width=40&query=teacher"
                                    }
                                  />
                                  <AvatarFallback>{booking.teacher_name?.charAt(0) || "T"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-medium text-sm sm:text-base">{booking.teacher_name}</p>
                                  <p className="text-sm text-muted-foreground">{booking.teacher_skill}</p>
                                  <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(booking.booking_date).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right">
                                <div>
                                  <p className="font-medium text-[#00B9D9] text-sm sm:text-base">
                                    ₹{booking.price_per_hour}
                                  </p>
                                  <Badge variant="outline" className="text-xs">
                                    Completed
                                  </Badge>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setSelectedBookingForChat(booking)}
                                  className="text-xs mt-2 sm:mt-2 relative"
                                >
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  Chat
                                  {unreadByBooking[booking.id] && unreadByBooking[booking.id] > 0 && (
                                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white text-xs">
                                      {unreadByBooking[booking.id]}
                                    </Badge>
                                  )}
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-center py-6 sm:py-8 text-sm sm:text-base">
                          No completed sessions yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Payments Tab */}
            <TabsContent value="payments" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                    <div className="text-center p-4 sm:p-6 border rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-[#00B9D9] mb-2">₹{totalSpent}</div>
                      <p className="text-sm text-muted-foreground">Total Spent</p>
                    </div>
                    <div className="text-center p-4 sm:p-6 border rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-[#FF6600] mb-2">
                        {completedBookings.length}
                      </div>
                      <p className="text-sm text-muted-foreground">Sessions Paid</p>
                    </div>
                    <div className="text-center p-4 sm:p-6 border rounded-lg">
                      <div className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                        ₹{completedBookings.length > 0 ? Math.round(totalSpent / completedBookings.length) : 0}
                      </div>
                      <p className="text-sm text-muted-foreground">Avg per Session</p>
                    </div>
                  </div>

                  {completedBookings.length > 0 && (
                    <div className="space-y-3 sm:space-y-4">
                      <h3 className="font-medium text-sm sm:text-base">Recent Payments</h3>
                      {completedBookings.slice(0, 10).map((booking) => (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 sm:p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-sm sm:text-base">{booking.teacher_name}</p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {booking.teacher_skill} • {new Date(booking.booking_date).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-[#00B9D9] text-sm sm:text-base">₹{booking.price_per_hour}</p>
                            <p className="text-xs text-muted-foreground">Paid</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Wishlist Tab */}
            <TabsContent value="wishlist" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">My Wishlist</CardTitle>
                </CardHeader>
                <CardContent>
                  {wishlistTeachers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                      {wishlistTeachers.map((teacher) => (
                        <Card key={teacher.id} className="overflow-hidden">
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={
                                teacher.photo_url || "/placeholder.svg?height=200&width=200&query=professional teacher"
                              }
                              alt={teacher.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base sm:text-lg">{teacher.name}</CardTitle>
                            <p className="text-sm font-medium text-[#00B9D9]">{teacher.skill}</p>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg sm:text-xl font-bold text-[#FF6600]">
                                  ₹{teacher.price_hour || 50}
                                </span>
                                <span className="text-sm text-muted-foreground">/hour</span>
                              </div>
                              <div className="flex space-x-2">
                                <Button size="sm" variant="outline" onClick={() => removeFromWishlist(teacher.skillId)}>
                                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-[#FF6600] hover:bg-[#FF6600]/90 text-white text-xs sm:text-sm"
                                  onClick={() => router.push("/marketplace")}
                                >
                                  Book Now
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 sm:py-12">
                      <Heart className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
                        Your wishlist is empty
                      </h3>
                      <p className="text-muted-foreground mb-4 text-sm sm:text-base px-4">
                        Browse teachers and add them to your wishlist to keep track of your favorites.
                      </p>
                      <Button
                        onClick={() => router.push("/marketplace")}
                        className="bg-[#FF6600] hover:bg-[#FF6600]/90 text-white"
                      >
                        Browse Teachers
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 sm:py-12">
                    <Settings className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Manage Your Settings</h3>
                    <p className="text-muted-foreground mb-4 text-sm sm:text-base px-4">
                      Adjust your preferences and settings here.
                    </p>
                    <Button
                      onClick={() => router.push("/settings")}
                      className="bg-[#FF6600] hover:bg-[#FF6600]/90 text-white"
                    >
                      Go to Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Video Call Interface */}
      {selectedBookingForCall && activeClassId && activeRoomId && (
        <VideoCallInterface
          roomId={activeRoomId}
          classId={activeClassId}
          userName={learner?.name || user?.user_metadata?.full_name || "Learner"}
          userRole="learner"
          onEndCall={handleCallEnd}
          isOpen={isVideoCallOpen}
          onClose={handleCallEnd}
        />
      )}
    </div>
  )
}
