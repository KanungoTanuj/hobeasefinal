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
  teacher_confirmed?: boolean
  learner_confirmed?: boolean
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
        const bookingIds = bookingsData.map((booking) => booking.id)
        const { data: completionData, error: completionError } = bookingIds.length
          ? await supabase.from("booking_completions").select("booking_id, teacher_confirmed, learner_confirmed").in("booking_id", bookingIds)
          : { data: [], error: null }
        if (completionError) console.error("[v0] Learner completion query error:", completionError)
        const completionsByBooking = new Map((completionData || []).map((completion) => [completion.booking_id, completion]))
        const normalizedBookings = bookingsData.map((booking) => ({
          ...booking,
          status: typeof booking.status === "string" ? booking.status.trim().toLowerCase() : booking.status,
          ...(completionsByBooking.get(booking.id) || {}),
        })) as Booking[]
        setBookings(normalizedBookings)

        // Calculate total spent
        const completed = normalizedBookings.filter((b) => b.status === "completed")
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

  useEffect(() => {
    if (!user?.email || bookings.length === 0) return
    const bookingIds = bookings.map((booking) => booking.id)
    const channel = supabase
      .channel(`learner-completions-${user.id}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "booking_completions",
        filter: `booking_id=in.(${bookingIds.join(",")})`,
      }, (payload) => {
        const completion = payload.new as { booking_id?: string; teacher_confirmed?: boolean; learner_confirmed?: boolean }
        if (!completion.booking_id || !bookingIds.includes(completion.booking_id)) return
        console.log("[v0] COMPLETION REALTIME UPDATE", {
          bookingId: completion.booking_id,
          teacherConfirmed: completion.teacher_confirmed,
          learnerConfirmed: completion.learner_confirmed,
          status: bookings.find((booking) => booking.id === completion.booking_id)?.status,
        })
        void fetchLearnerData(user.email!)
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [user?.email, user?.id, bookings.length])

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

  const handleConfirmCompletion = async (booking: Booking) => {
    const response = await fetch("/api/bookings/confirm-completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Unable to confirm completion" }))
      alert(data.error)
      return
    }
    await fetchLearnerData(user?.email || booking.learner_email)
  }

  const handleCallEnd = () => {
    setIsVideoCallOpen(false)
    setSelectedBookingForCall(null)
    setActiveClassId(null)
    setActiveRoomId(null)
  }

  useEffect(() => {
    const checkStatuses = async () => {
      const confirmedBookings = bookings.filter((b) => ["confirmed", "in_progress"].includes(b.status))
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

  const upcomingBookings = bookings.filter((b) => ["confirmed", "pending", "in_progress", "awaiting_completion"].includes(b.status))
  const completedBookings = bookings.filter((b) => b.status === "completed")

  console.log("[v0] Total bookings:", bookings.length)
  console.log("[v0] Upcoming bookings (pending + confirmed):", upcomingBookings.length)
  console.log("[v0] Completed bookings:", completedBookings.length)

  return (
    <div className="learner-dashboard min-h-screen bg-[#f8fbfd] text-[#12243b]">
      <Tabs defaultValue="overview" className="min-h-screen">
        <div className="flex min-h-screen flex-col lg:flex-row">
          <aside className="w-full shrink-0 border-b border-slate-200 bg-white px-4 py-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r lg:px-5 lg:py-7">
            <div className="mb-7 flex items-center gap-3 px-2"><div className="flex size-10 items-center justify-center rounded-2xl bg-[#e2f7fb] text-lg font-black text-[#079ab6]">H</div><div><p className="text-lg font-black tracking-tight">hobease</p><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Learn together</p></div></div>
            <TabsList className="flex h-auto w-full flex-row gap-1 overflow-x-auto bg-transparent p-0 lg:flex-col lg:items-stretch">
              <TabsTrigger value="overview" className="justify-start gap-3 rounded-xl px-3 py-3 text-slate-500 data-[state=active]:bg-[#e8f8fb] data-[state=active]:text-[#087e9b]"><TrendingUp /> Overview</TabsTrigger>
              <TabsTrigger value="bookings" className="justify-start gap-3 rounded-xl px-3 py-3 text-slate-500 data-[state=active]:bg-[#e8f8fb] data-[state=active]:text-[#087e9b]"><BookOpen /> My Tutors</TabsTrigger>
              <TabsTrigger value="payments" className="justify-start gap-3 rounded-xl px-3 py-3 text-slate-500 data-[state=active]:bg-[#e8f8fb] data-[state=active]:text-[#087e9b]"><CreditCard /> Payments</TabsTrigger>
              <TabsTrigger value="wishlist" className="justify-start gap-3 rounded-xl px-3 py-3 text-slate-500 data-[state=active]:bg-[#e8f8fb] data-[state=active]:text-[#087e9b]"><Heart /> Wishlist</TabsTrigger>
              <TabsTrigger value="settings" className="justify-start gap-3 rounded-xl px-3 py-3 text-slate-500 data-[state=active]:bg-[#e8f8fb] data-[state=active]:text-[#087e9b]"><Settings /> Settings</TabsTrigger>
            </TabsList>
            <div className="hidden border-t border-slate-100 pt-5 lg:block"><Button variant="ghost" onClick={() => router.push("/")} className="w-full justify-start gap-3 text-slate-500"><Home /> Back to home</Button><Button variant="ghost" onClick={() => router.push("/learner/preferences")} className="w-full justify-start gap-3 text-slate-500"><Settings /> Preferences</Button><Button variant="ghost" onClick={() => router.push("/learner/ratings")} className="w-full justify-start gap-3 text-slate-500"><Star /> Ratings</Button></div>
          </aside>
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-10 lg:py-9">
            <header className="mb-7 flex items-start justify-between gap-4"><div><p className="text-sm font-semibold text-[#079ab6]">Learner Dashboard</p><h1 className="mt-1 text-2xl font-bold tracking-tight text-[#12243b] sm:text-3xl">Your learning journey at a glance</h1></div><div className="flex items-center gap-3"><Button variant="ghost" size="icon" className="rounded-xl text-slate-500"><Bell /></Button><Avatar className="size-10 border-2 border-white shadow-sm"><AvatarImage src="/student-avatar.png" /><AvatarFallback className="bg-[#ffeadf] text-[#d85b20]">{learner?.name?.charAt(0) || "L"}</AvatarFallback></Avatar><div className="hidden sm:block"><p className="text-sm font-semibold">{learner?.name || user?.user_metadata?.full_name || "Learner"}</p><p className="text-xs text-slate-500">{learner?.email || user?.email}</p></div></div></header>
            <section className="relative mb-7 overflow-hidden rounded-[1.75rem] border border-[#d5edf2] bg-gradient-to-br from-[#ddf8fb] via-white to-[#fff0e4] p-6 shadow-[0_18px_45px_-32px_rgba(0,144,178,0.5)] sm:p-8"><div className="pointer-events-none absolute -right-10 -top-16 size-48 rounded-full bg-[#00b9d9]/15 blur-3xl" /><div className="pointer-events-none absolute -bottom-20 right-32 size-44 rounded-full bg-[#ff7c3b]/15 blur-3xl" /><div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center"><div className="flex items-center gap-4"><Avatar className="size-16 border-4 border-white shadow-md sm:size-20"><AvatarImage src="/student-avatar.png" /><AvatarFallback className="bg-[#ffeadf] text-xl font-bold text-[#d85b20]">{learner?.name?.charAt(0) || user?.email?.charAt(0) || "L"}</AvatarFallback></Avatar><div><p className="text-sm font-semibold text-[#087e9b]">Welcome back</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-[#12243b] sm:text-3xl">{learner?.name || user?.user_metadata?.full_name || "Learner"}</h2><p className="mt-1 text-sm text-slate-600">{learner?.email || user?.email}</p></div></div><div className="max-w-sm sm:text-right"><p className="text-lg font-semibold text-[#233a55]">Keep learning, one session at a time.</p><p className="mt-1 text-sm text-slate-600">Your next milestone is closer than you think.</p></div></div></section>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div className="space-y-6">
                  <Card className="border-slate-200/80 bg-white shadow-[0_16px_38px_-30px_rgba(15,35,60,0.5)]"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-xl text-[#12243b]">Upcoming Sessions</CardTitle><p className="mt-1 text-sm text-slate-500">Your next steps are all in one place.</p></div><Badge className="bg-[#e8f8fb] text-[#087e9b] hover:bg-[#e8f8fb]">{upcomingBookings.length} scheduled</Badge></CardHeader><CardContent className="space-y-3">{upcomingBookings.length > 0 ? upcomingBookings.map((booking) => (<div key={booking.id} className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-[#fcfeff] p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center"><div className="flex min-w-0 flex-1 items-center gap-3"><Avatar className="size-12 shrink-0"><AvatarImage src={booking.teacher?.photo_url || "/placeholder.svg?height=48&width=48&query=teacher"} /><AvatarFallback className="bg-[#e2f7fb] text-[#087e9b]">{booking.teacher_name?.charAt(0) || "T"}</AvatarFallback></Avatar><div className="min-w-0"><p className="truncate font-semibold text-[#1d334d]">{booking.teacher_name}</p><p className="text-sm text-[#087e9b]">{booking.teacher_skill}</p><div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500"><span className="flex items-center gap-1"><Calendar />{new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).format(new Date(`${booking.booking_date}T00:00:00Z`))}</span><span className="flex items-center gap-1"><Clock />{booking.booking_time}</span></div></div></div><div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end"><div className="text-left sm:text-right"><p className="font-semibold text-[#e3682e]">₹{booking.price_per_hour}</p><Badge variant="secondary" className="mt-1 bg-[#e8f8fb] text-[#087e9b]">{booking.status === "awaiting_completion" ? booking.learner_confirmed ? "Awaiting teacher" : "Awaiting confirmation" : booking.status === "in_progress" ? "In Progress" : booking.status === "confirmed" ? "Confirmed" : "Pending"}</Badge></div><div className="flex gap-2">{booking.status === "in_progress" && <Button size="sm" onClick={() => { if (!classStatuses[booking.id]) { alert("The teacher hasn't started the class yet. Please wait for them to start."); return } handleJoinClass(booking) }} disabled={!classStatuses[booking.id]} className="bg-[#087e9b] text-xs hover:bg-[#076b84]"><Video /> Join</Button>}{booking.status === "awaiting_completion" && !booking.learner_confirmed && <Button size="sm" onClick={() => void handleConfirmCompletion(booking)} className="bg-[#087e9b] text-xs hover:bg-[#076b84]">Confirm</Button>}<Button size="sm" variant="outline" onClick={() => setSelectedBookingForChat(booking)} className="relative text-xs"><MessageSquare /> Chat{unreadByBooking[booking.id] && <Badge className="absolute -right-2 -top-2 size-5 bg-[#e3682e] p-0 text-[10px] text-white">{unreadByBooking[booking.id]}</Badge>}</Button></div></div></div>)) : <p className="py-8 text-center text-sm text-slate-500">No upcoming sessions</p>}</CardContent></Card>
                  <Card className="border-slate-200/80 bg-white shadow-[0_16px_38px_-30px_rgba(15,35,60,0.5)]"><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-xl text-[#12243b]">Past Sessions</CardTitle><p className="mt-1 text-sm text-slate-500">Your completed learning history.</p></div><BookOpen className="text-slate-300" /></CardHeader><CardContent className="space-y-3">{completedBookings.length > 0 ? completedBookings.slice(0, 5).map((booking) => (<div key={booking.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4"><Avatar className="size-11"><AvatarImage src={booking.teacher?.photo_url || "/placeholder.svg?height=44&width=44&query=teacher"} /><AvatarFallback>{booking.teacher_name?.charAt(0) || "T"}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="font-semibold text-[#1d334d]">{booking.teacher_name}</p><p className="text-sm text-slate-500">{booking.teacher_skill} · {new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).format(new Date(`${booking.booking_date}T00:00:00Z`))}</p></div><div className="text-right"><p className="font-semibold text-[#e3682e]">₹{booking.price_per_hour}</p><Badge variant="secondary" className="bg-[#edf8ee] text-[#3a8a52]">Completed</Badge></div></div>)) : <p className="py-8 text-center text-sm text-slate-500">No completed sessions yet</p>}</CardContent></Card>
                </div>
                <div className="space-y-6"><Card className="border-slate-200/80 bg-white"><CardHeader><CardTitle className="text-lg">Calendar</CardTitle><p className="text-sm text-slate-500">Your booked dates</p></CardHeader><CardContent><div className="grid grid-cols-7 gap-1 text-center text-xs">{["S","M","T","W","T","F","S"].map((day, index) => <span key={`${day}-${index}`} className="py-2 font-semibold text-slate-400">{day}</span>)}{Array.from({ length: 35 }, (_, index) => { const date = index - 1; const event = bookings.some((booking) => new Date(`${booking.booking_date}T00:00:00Z`).getUTCDate() === date); return <span key={index} className={`rounded-lg py-2 ${event ? "bg-[#e8f8fb] font-bold text-[#087e9b]" : "text-slate-600"}`}>{date > 0 && date <= 31 ? date : ""}</span> })}</div></CardContent></Card><Card className="border-slate-200/80 bg-white"><CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader><CardContent className="grid gap-2"><Button variant="outline" onClick={() => router.push("/marketplace")} className="justify-start gap-3"><BookOpen /> Explore Tutors</Button><Button variant="outline" onClick={() => router.push("/learner/preferences")} className="justify-start gap-3"><Heart /> My Wishlist</Button><Button variant="outline" onClick={() => router.push("/learner/ratings")} className="justify-start gap-3"><Star /> My Ratings</Button><Button variant="outline" onClick={() => router.push("/learner/preferences")} className="justify-start gap-3"><Settings /> Preferences</Button></CardContent></Card><div className="rounded-[1.5rem] bg-gradient-to-br from-[#fff0e4] to-[#e2f7fb] p-6"><p className="text-lg font-bold text-[#233a55]">Small steps, big progress.</p><p className="mt-2 text-sm leading-6 text-slate-600">Stay curious and keep showing up for your goals.</p></div></div>
              </div>
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
                                      <span>{new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).format(new Date(`${booking.booking_date}T00:00:00Z`))}</span>
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
                                    {booking.status === "awaiting_completion"
                                      ? booking.learner_confirmed
                                        ? "Awaiting Teacher Confirmation"
                                        : "Awaiting Your Confirmation"
                                      : booking.status === "in_progress"
                                        ? "In Progress"
                                        : booking.status === "confirmed"
                                          ? "Confirmed"
                                          : "Pending"}
                                  </Badge>
                                  {booking.status === "awaiting_completion" && booking.learner_confirmed && (
                                    <p className="mt-1 text-xs text-muted-foreground">You have confirmed. Waiting for the teacher.</p>
                                  )}
                                  {booking.status === "awaiting_completion" && !booking.learner_confirmed && booking.teacher_confirmed && (
                                    <p className="mt-1 text-xs text-muted-foreground">Teacher has confirmed.</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
{booking.status === "in_progress" && (
  <Button
    size="sm"
    onClick={() => {
      if (!classStatuses[booking.id]) {
        alert(
          "The teacher hasn't started the class yet. Please wait for them to start.",
        )
        return
      }
      handleJoinClass(booking)
    }}
    disabled={!classStatuses[booking.id]}
    className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50"
    title={!classStatuses[booking.id] ? "Waiting for teacher to start" : "Join video class"}
  >
    <Video className="h-3 w-3 mr-1" />
    {classStatuses[booking.id] ? "Join Class" : "Join Class (Not Started)"}
  </Button>
)}
                                  {booking.status === "awaiting_completion" && !booking.learner_confirmed && (
                                    <Button size="sm" onClick={() => void handleConfirmCompletion(booking)} className="text-xs bg-[#00B9D9] hover:bg-[#009ab5]">
                                      Confirm Complete
                                    </Button>
                                  )}
                                  {(["confirmed", "pending", "in_progress", "awaiting_completion", "completed"].includes(booking.status)) && (
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
                                    <span>{new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).format(new Date(`${booking.booking_date}T00:00:00Z`))}</span>
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
                              {booking.teacher_skill} • {new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).format(new Date(`${booking.booking_date}T00:00:00Z`))}
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
        </main>
        </div>
      </Tabs>

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
          booking={selectedBookingForCall}
          currentUserId={user?.id || ""}
          currentUserEmail={user?.email || ""}
        />
      )}
    </div>
  )
}
