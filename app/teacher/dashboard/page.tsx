"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient, getInitialSession } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ChatInterface } from "@/components/chat-interface"
import { AvailabilityManager } from "@/components/availability-manager"
import { VideoCallInterface } from "@/components/video-call-interface"
import {
  User,
  BookOpen,
  Calendar,
  DollarSign,
  TrendingUp,
  MessageSquare,
  Edit,
  Eye,
  Star,
  Clock,
  Users,
  Home,
  Plus,
  Trash2,
  Award,
  Video,
  Bell,
} from "lucide-react"
import { useRouter } from "next/navigation"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import { useIsMobile } from "@/hooks/use-mobile"

interface Teacher {
  id: string
  name: string
  email: string
  skill: string
  experience: string
  bio: string
  photo_url: string | null
  created_at?: string
}

interface TeacherSkill {
  id: string
  teacher_id: string
  skill_name: string
  skill_category: string
  proficiency_level: string
  years_experience: number
  price_per_hour: number
  description: string | null
  is_primary: boolean
  created_at: string
}

interface Booking {
  id: string
  learner_name: string
  learner_email: string
  booking_date: string
  booking_time: string
  status: string
  price_per_hour: number
  teacher_skill: string
  teacher_confirmed?: boolean
  learner_confirmed?: boolean
}

export default function TeacherDashboard() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [skills, setSkills] = useState<TeacherSkill[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false)
  const [newSkill, setNewSkill] = useState({
    skill_name: "",
    skill_category: "",
    proficiency_level: "intermediate",
    years_experience: 1,
    price_per_hour: 1000,
    description: "",
  })
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<Booking | null>(null)
  const [selectedBookingForCall, setSelectedBookingForCall] = useState<Booking | null>(null)
  const [activeClassId, setActiveClassId] = useState<string | null>(null)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false)
  const [unreadByBooking, setUnreadByBooking] = useState<{ [key: string]: number }>({})
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await getInitialSession()

        if (!session?.user) {
          router.push("/auth")
          return
        }

        setUser(session.user)
        await fetchTeacherData(session.user.email!, session.user.id)
      } catch (error) {
        console.error("[v0] Error checking teacher auth:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

  const fetchTeacherData = async (email: string, authId?: string) => {
    try {
      console.log("[v0] Fetching teacher data for email:", email)

      const supabase = createClientComponentClient()

      const teacherColumns = "id, name, email, skill, experience, bio, photo_url"
      const { data: teacherByAuthId, error: authLookupError } = await supabase
        .from("Teachers")
        .select(teacherColumns)
        .eq("auth_id", authId ?? "")
        .maybeSingle()

      const { data: teacherByEmail, error: emailLookupError } = teacherByAuthId
        ? { data: null, error: null }
        : await supabase
            .from("Teachers")
            .select(teacherColumns)
            .eq("email", email)
            .limit(1)
            .maybeSingle()

      const teacherData = teacherByAuthId ?? teacherByEmail
      const teacherError = teacherData
        ? null
        : authLookupError ?? emailLookupError ?? new Error("Teacher profile not found")

      console.log("[v0] Teacher query result:", {
        data: teacherData,
        authLookupError,
        emailLookupError,
      })

      if (teacherError || !teacherData) {
        console.error("Error fetching teacher:", teacherError)
        router.push("/")
        return
      }

      if (!teacherData) {
        console.error("No teacher found")
        router.push("/")
        return
      }

      setTeacher(teacherData)
      console.log("[v0] Found teacher:", teacherData)

      await fetchTeacherSkills(teacherData.id)

      console.log("[v0] Fetching bookings for teacher_id:", teacherData.id)

      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("teacher_id", teacherData.id)
        .order("booking_date", { ascending: false })

      console.log("[v0] Bookings query result:", { data: bookingsData, error: bookingsError })
      console.log("[v0] Number of bookings found:", bookingsData?.length || 0)

      if (bookingsError) {
        console.error("[v0] Bookings query error:", bookingsError)
      }

      if (!bookingsError) {
        const bookingIds = (bookingsData || []).map((booking) => booking.id)
        const { data: completionData, error: completionError } = bookingIds.length
          ? await supabase.from("booking_completions").select("booking_id, teacher_confirmed, learner_confirmed").in("booking_id", bookingIds)
          : { data: [], error: null }
        if (completionError) console.error("[v0] Teacher completion query error:", completionError)
        const completionsByBooking = new Map((completionData || []).map((completion) => [completion.booking_id, completion]))
        setBookings((bookingsData || []).map((booking) => ({
          ...booking,
          ...(completionsByBooking.get(booking.id) || {}),
        })))
        console.log("[v0] Set bookings state with", bookingsData?.length || 0, "bookings")
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user?.id || bookings.length === 0) return
    const supabase = createClientComponentClient()
    const bookingIds = bookings.map((booking) => booking.id)
    const channel = supabase
      .channel(`teacher-completions-${user.id}`)
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
        void fetchTeacherData(user.email!, user.id)
      })
      .subscribe()
    return () => { void supabase.removeChannel(channel) }
  }, [user?.id, user?.email, bookings.length])

  const fetchTeacherSkills = async (teacherId: string) => {
    try {
      const supabase = createClientComponentClient()

      const { data: skillsData, error: skillsError } = await supabase
        .from("teacher_skills")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("is_primary", { ascending: false })

      if (skillsError) {
        console.error("Error fetching skills:", skillsError)
        return
      }

      setSkills(skillsData || [])
      console.log("[v0] Fetched skills:", skillsData)
    } catch (error) {
      console.error("Error fetching skills:", error)
    }
  }

  const handleAddSkill = async () => {
    if (!teacher || !newSkill.skill_name || !newSkill.skill_category) {
      alert("Please fill in all required fields")
      return
    }

    try {
      const supabase = createClientComponentClient()

      const { data, error } = await supabase
        .from("teacher_skills")
        .insert({
          teacher_id: teacher.id,
          skill_name: newSkill.skill_name,
          skill_category: newSkill.skill_category,
          proficiency_level: newSkill.proficiency_level,
          years_experience: newSkill.years_experience,
          price_per_hour: newSkill.price_per_hour,
          description: newSkill.description || null,
          is_primary: skills.length === 0,
        })
        .select()
        .single()

      if (error) {
        console.error("Error adding skill:", error)
        alert("Failed to add skill. Please try again.")
        return
      }

      setSkills([...skills, data])
      setIsAddSkillOpen(false)
      setNewSkill({
        skill_name: "",
        skill_category: "",
        proficiency_level: "intermediate",
        years_experience: 1,
        price_per_hour: 1000,
        description: "",
      })
      alert("Skill added successfully!")
    } catch (error) {
      console.error("Error adding skill:", error)
      alert("Failed to add skill. Please try again.")
    }
  }

  const handleDeleteSkill = async (skillId: string) => {
    if (!confirm("Are you sure you want to delete this skill?")) {
      return
    }

    try {
      const supabase = createClientComponentClient()

      const { error } = await supabase.from("teacher_skills").delete().eq("id", skillId)

      if (error) {
        console.error("Error deleting skill:", error)
        alert("Failed to delete skill. Please try again.")
        return
      }

      setSkills(skills.filter((skill) => skill.id !== skillId))
      alert("Skill deleted successfully!")
    } catch (error) {
      console.error("Error deleting skill:", error)
      alert("Failed to delete skill. Please try again.")
    }
  }

  const handleStartClass = async (booking: Booking) => {
    try {
      console.log("[v0] Starting class for booking:", booking.id)
      console.log("[v0] Booking details:", {
        id: booking.id,
        learner_name: booking.learner_name,
        teacher_skill: booking.teacher_skill,
        status: booking.status,
      })

      const response = await fetch("/api/classes/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      })

      console.log("[v0] API response status:", response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("[v0] API error response:", errorData)
        throw new Error(errorData.error || "Failed to start class")
      }

      const data = await response.json()
      console.log("[v0] Class started successfully:", data)

      setActiveClassId(data.classId)
      setActiveRoomId(data.roomId)
      setSelectedBookingForCall(booking)
      setIsVideoCallOpen(true)
    } catch (error) {
      console.error("[v0] Error starting class:", error)
      alert(`Failed to start class: ${error instanceof Error ? error.message : "Please try again."}`)
    }
  }

  const handleCallClose = () => {
    setIsVideoCallOpen(false)
    setSelectedBookingForCall(null)
    setActiveClassId(null)
    setActiveRoomId(null)
  }

  const handleCallEnd = () => {
    handleCallClose()
    setBookings((currentBookings) => currentBookings.map((booking) => booking.id === selectedBookingForCall?.id ? { ...booking, status: "awaiting_completion" } : booking))
  }

  const handleConfirmCompletion = async (booking: Booking) => {
    console.log("[v0] TEACHER CONFIRM COMPLETE", {
      bookingId: booking.id,
      authenticatedUserId: user?.id ?? null,
    })
    const response = await fetch("/api/bookings/confirm-teacher-completion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId: booking.id }),
    })
    if (!response.ok) {
      const data = await response.json().catch(() => ({ error: "Unable to confirm completion" }))
      console.error("[v0] TEACHER CONFIRM RESULT", { bookingId: booking.id, success: false, error: data.error })
      alert(data.error)
      return
    }
    console.log("[v0] TEACHER CONFIRM RESULT", { bookingId: booking.id, success: true, error: null })
    const supabase = createClientComponentClient()
    const { data } = await supabase.from("bookings").select("*").eq("id", booking.id).single()
    setBookings((current) => current.map((item) => item.id === booking.id ? { ...item, ...(data || {}) } : item))
  }

  const getProfileCompletion = () => {
    if (!teacher) return 0
    let completed = 0
    const fields = [teacher.name, teacher.bio, teacher.photo_url]
    fields.forEach((field) => field && completed++)
    if (skills.length > 0) completed++
    return (completed / (fields.length + 1)) * 100
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const totalEarnings = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.price_per_hour || 0), 0)

  const upcomingBookings = bookings.filter((b) => {
    const isUpcoming = b.status === "confirmed" && new Date(b.booking_date) >= new Date()
    console.log("[v0] Booking", b.id, "status:", b.status, "date:", b.booking_date, "isUpcoming:", isUpcoming)
    return isUpcoming
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You are not registered as a teacher.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7fbff] text-[#102a43]">
      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <aside className="hidden w-60 shrink-0 flex-col rounded-[28px] border border-[#dcecf5] bg-white p-4 shadow-[0_16px_45px_rgba(16,42,67,0.06)] lg:flex">
          <div className="flex items-center gap-3 px-3 py-4">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#dff7fc] text-[#00a9c7]"><BookOpen data-icon="inline-start" /></div>
            <div><p className="font-bold tracking-tight">Hobease</p><p className="text-xs text-[#6d8295]">Teach with purpose</p></div>
          </div>
          <nav className="mt-8 flex flex-1 flex-col gap-2" aria-label="Teacher navigation">
            {[['overview', TrendingUp, 'Overview'], ['profile', User, 'Profile'], ['skills', Award, 'Skills'], ['classes', BookOpen, 'Classes'], ['students', Users, 'Students'], ['earnings', DollarSign, 'Earnings'], ['messages', MessageSquare, 'Messages']].map(([tab, Icon, label]) => (
              <button key={tab as string} type="button" onClick={() => setActiveTab(tab as string)} className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-colors ${activeTab === tab ? 'bg-[#e5f8fc] text-[#087f9c]' : 'text-[#6d8295] hover:bg-[#f4faff]'}`}>
                <Icon data-icon="inline-start" />{label as string}{tab === 'messages' && Object.values(unreadByBooking).some((count) => count > 0) && <span className="ml-auto size-2 rounded-full bg-[#f59e0b]" />}
              </button>
            ))}
          </nav>
          <Button variant="ghost" onClick={() => router.push('/')} className="justify-start gap-3 rounded-2xl text-[#6d8295]"><Home data-icon="inline-start" />Back to home</Button>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
            <div><p className="mb-1 text-sm font-medium text-[#00a9c7]">Teacher Dashboard</p><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your teaching journey at a glance</h1></div>
            <div className="flex items-center gap-3"><Button size="icon" variant="outline" className="rounded-2xl border-[#dcecf5] bg-white" aria-label="Notifications"><Bell data-icon="inline-start" /></Button><Avatar className="size-11 border-2 border-white shadow-sm"><AvatarImage src={teacher.photo_url || undefined} alt={teacher.name || 'Teacher'} /><AvatarFallback className="bg-[#dff7fc] text-[#087f9c]">{teacher.name?.charAt(0) || 'T'}</AvatarFallback></Avatar><div className="hidden sm:block"><p className="text-sm font-semibold">{teacher.name || 'Teacher'}</p><p className="text-xs text-[#6d8295]">Active teacher</p></div></div>
          </header>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="overflow-x-auto lg:hidden"><TabsList className="inline-flex min-w-full justify-start rounded-2xl bg-white p-1 shadow-sm">
              {['overview','profile','skills','classes','students','earnings','messages'].map((tab) => <TabsTrigger key={tab} value={tab} className="rounded-xl px-3 py-2 text-xs capitalize sm:px-4 sm:text-sm">{tab}</TabsTrigger>)}
            </TabsList></div>
            <TabsContent value="overview" className="space-y-6">
              <Card className="overflow-hidden rounded-[28px] border-[#dcecf5] bg-white shadow-[0_18px_50px_rgba(16,42,67,0.07)]">
                <CardContent className="relative p-6 sm:p-8"><div className="pointer-events-none absolute -right-8 -top-12 size-40 rounded-full bg-[#dff7fc] blur-2xl" /><div className="pointer-events-none absolute bottom-0 right-24 size-24 rounded-full bg-[#fff0d7] blur-2xl" /><div className="relative flex flex-col gap-6 sm:flex-row sm:items-center"><Avatar className="size-20 border-4 border-white shadow-md"><AvatarImage src={teacher.photo_url || undefined} alt={teacher.name || 'Teacher'} /><AvatarFallback className="bg-[#e5f8fc] text-2xl font-semibold text-[#087f9c]">{teacher.name?.charAt(0) || 'T'}</AvatarFallback></Avatar><div className="flex-1"><Badge className="mb-3 border-0 bg-[#fff0d7] text-[#a96800]">Active teacher</Badge><h2 className="text-2xl font-bold sm:text-3xl">Welcome back, {teacher.name || 'Teacher'}</h2><p className="mt-2 max-w-xl text-sm leading-6 text-[#6d8295]">Create meaningful learning moments, keep your classes moving, and help every learner make progress.</p><p className="mt-3 text-sm font-medium text-[#087f9c]">{teacher.email}</p></div><Button onClick={() => router.push('/teacher/profile')} className="rounded-xl bg-[#102a43] hover:bg-[#173f5f]"><Edit data-icon="inline-start" />Edit profile</Button></div></CardContent>
              </Card>

              <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                <Card className="rounded-[28px] border-[#dcecf5] bg-white shadow-[0_14px_40px_rgba(16,42,67,0.05)]"><CardHeader className="flex flex-row items-start justify-between gap-4"><div><CardTitle className="text-xl">Upcoming classes</CardTitle><CardDescription>Keep your next learning moments in view.</CardDescription></div><Button variant="ghost" size="sm" onClick={() => setActiveTab('classes')} className="text-[#087f9c]">View classes</Button></CardHeader><CardContent className="flex flex-col gap-3">{upcomingBookings.length === 0 ? <div className="rounded-2xl bg-[#f7fbff] p-6 text-center text-sm text-[#6d8295]">No upcoming classes yet.</div> : upcomingBookings.slice(0, 3).map((booking) => <div key={booking.id} className="flex flex-col gap-4 rounded-2xl border border-[#e4f0f5] bg-[#fbfdff] p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Avatar className="size-11"><AvatarFallback className="bg-[#fff0d7] text-[#a96800]">{booking.learner_name.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{booking.learner_name}</p><p className="text-sm text-[#6d8295]">{booking.teacher_skill}</p><p className="mt-1 text-xs text-[#087f9c]">{new Intl.DateTimeFormat('en-US', { timeZone: 'UTC' }).format(new Date(`${booking.booking_date}T00:00:00Z`))} · {booking.booking_time}</p></div></div><div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-[#e5f8fc] text-[#087f9c]">Confirmed</Badge><Button size="sm" onClick={() => handleStartClass(booking)} className="rounded-xl bg-[#00a9c7] hover:bg-[#087f9c]"><Video data-icon="inline-start" />Start class</Button></div></div>)}</CardContent></Card>
                <div className="flex flex-col gap-6"><Card className="rounded-[28px] border-[#dcecf5] bg-white shadow-[0_14px_40px_rgba(16,42,67,0.05)]"><CardHeader><CardTitle className="text-xl">Your momentum</CardTitle><CardDescription>A quick look at your teaching activity.</CardDescription></CardHeader><CardContent className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-[#e5f8fc] p-4"><p className="text-2xl font-bold text-[#087f9c]">{bookings.length}</p><p className="mt-1 text-xs text-[#087f9c]">Bookings</p></div><div className="rounded-2xl bg-[#fff0d7] p-4"><p className="text-2xl font-bold text-[#a96800]">₹{totalEarnings}</p><p className="mt-1 text-xs text-[#a96800]">Earned</p></div></CardContent></Card><Card className="rounded-[28px] border-[#dcecf5] bg-white shadow-[0_14px_40px_rgba(16,42,67,0.05)]"><CardHeader><CardTitle className="text-xl">Profile progress</CardTitle><CardDescription>Complete your profile to attract more learners.</CardDescription></CardHeader><CardContent><Progress value={getProfileCompletion()} className="mb-3" /><div className="flex items-center justify-between text-sm"><span className="text-[#6d8295]">{Math.round(getProfileCompletion())}% complete</span><Button variant="link" size="sm" onClick={() => router.push('/teacher/profile')} className="px-0 text-[#087f9c]">Finish profile</Button></div></CardContent></Card></div>
              </div>
            </TabsContent>

          <TabsContent value="profile" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Profile Overview</CardTitle>
                <CardDescription className="text-sm">Your teacher profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                  <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mx-auto sm:mx-0">
                    <AvatarImage src={teacher.photo_url || undefined} />
                    <AvatarFallback>{teacher.name ? teacher.name.charAt(0) : "T"}</AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h3 className="text-lg sm:text-xl font-semibold">{teacher.name || "Teacher"}</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {skills.find((s) => s.is_primary)?.skill_name || "No primary skill set"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">{teacher.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Experience</h4>
                    <p className="text-gray-600 text-sm sm:text-base">
                      {teacher.experience || "No experience specified"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">Bio</h4>
                    <p className="text-gray-600 text-sm sm:text-base">{teacher.bio || "No bio provided"}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button className="w-full sm:w-auto" onClick={() => router.push("/teacher/profile")}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto bg-transparent" onClick={() => teacher?.id && router.push(`/teachers/${teacher.id}`)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview as Learner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">My Skills</h2>
                <p className="text-gray-600 text-sm sm:text-base">Manage your teaching skills and expertise</p>
              </div>
              <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    Add New Skill
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px] mx-4 sm:mx-0">
                  <DialogHeader>
                    <DialogTitle>Add New Skill</DialogTitle>
                    <DialogDescription>Add a new skill to your teaching profile</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="skill_name">Skill Name *</Label>
                      <Input
                        id="skill_name"
                        value={newSkill.skill_name}
                        onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                        placeholder="e.g., Web Development, Photography"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="skill_category">Category *</Label>
                      <Select
                        value={newSkill.skill_category}
                        onValueChange={(value) => setNewSkill({ ...newSkill, skill_category: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Creative">Creative Arts</SelectItem>
                          <SelectItem value="Business">Business</SelectItem>
                          <SelectItem value="Language">Language</SelectItem>
                          <SelectItem value="Music">Music</SelectItem>
                          <SelectItem value="Fitness">Fitness & Health</SelectItem>
                          <SelectItem value="Academic">Academic</SelectItem>
                          <SelectItem value="Lifestyle">Lifestyle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="proficiency_level">Proficiency Level</Label>
                      <Select
                        value={newSkill.proficiency_level}
                        onValueChange={(value) => setNewSkill({ ...newSkill, proficiency_level: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="years_experience">Years of Experience</Label>
                      <Input
                        id="years_experience"
                        type="number"
                        min="0"
                        max="50"
                        value={newSkill.years_experience}
                        onChange={(e) =>
                          setNewSkill({ ...newSkill, years_experience: Number.parseInt(e.target.value) || 1 })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price_per_hour">Price per Hour (₹)</Label>
                      <Input
                        id="price_per_hour"
                        type="number"
                        min="100"
                        max="10000"
                        value={newSkill.price_per_hour}
                        onChange={(e) =>
                          setNewSkill({ ...newSkill, price_per_hour: Number.parseInt(e.target.value) || 1000 })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={newSkill.description}
                        onChange={(e) => setNewSkill({ ...newSkill, description: e.target.value })}
                        placeholder="Describe your expertise in this skill..."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsAddSkillOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleAddSkill}>
                      Add Skill
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {skills.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 sm:py-12">
                  <Award className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Skills Added Yet</h3>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base px-4">
                    Add your first skill to start attracting students
                  </p>
                  <Button onClick={() => setIsAddSkillOpen(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Skill
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {skills.map((skill) => (
                  <Card key={skill.id} className="relative">
                    {skill.is_primary && (
                      <Badge className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        Primary
                      </Badge>
                    )}
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base sm:text-lg">{skill.skill_name}</CardTitle>
                      <CardDescription className="text-sm">{skill.skill_category}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Proficiency:</span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {skill.proficiency_level}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Experience:</span>
                        <span>{skill.years_experience} years</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Price:</span>
                        <span className="font-medium">₹{skill.price_per_hour}/hr</span>
                      </div>
                      {skill.description && <p className="text-sm text-gray-600 line-clamp-2">{skill.description}</p>}
                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1 bg-transparent text-xs sm:text-sm">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                          onClick={() => handleDeleteSkill(skill.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            {teacher && <AvailabilityManager teacherId={teacher.id} />}
          </TabsContent>

          <TabsContent value="students" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Recent Bookings</CardTitle>
                <CardDescription className="text-sm">Your student bookings and their status</CardDescription>
              </CardHeader>
              <CardContent>
                {bookings.length === 0 ? (
                  <p className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">No bookings yet</p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {bookings.slice(0, 10).map((booking) => (
                      <div
                        key={booking.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border rounded-lg space-y-3 sm:space-y-0"
                      >
                        <div>
                          <h4 className="font-medium text-sm sm:text-base">{booking.learner_name}</h4>
                          <p className="text-sm text-gray-600">{booking.learner_email}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).format(new Date(`${booking.booking_date}T00:00:00Z`))} at {booking.booking_time}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right gap-2">
                          <div>
                            <Badge className={`${getStatusColor(booking.status)} border-0 mb-2 text-xs`}>
                              {booking.status}
                            </Badge>
                            <p className="text-sm font-medium mb-2">₹{booking.price_per_hour}/hr</p>
                          </div>
                          <div className="flex gap-2">
                            {booking.status === "awaiting_completion" && (
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-muted-foreground">Awaiting Completion</span>
                                {!booking.teacher_confirmed && (
                                  <Button size="sm" onClick={() => void handleConfirmCompletion(booking)} className="text-xs bg-[#00B9D9] hover:bg-[#009ab5]">
                                    Confirm Complete
                                  </Button>
                                )}
                                {booking.teacher_confirmed && <span className="text-xs text-muted-foreground">Awaiting learner confirmation</span>}
                                {!booking.teacher_confirmed && booking.learner_confirmed && <span className="text-xs text-muted-foreground">Learner has confirmed.</span>}
                              </div>
                            )}
                            {(booking.status === "confirmed" || booking.status === "pending") && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  if (booking.status === "pending") {
                                    alert("Please confirm this booking first before starting a class.")
                                    return
                                  }
                                  handleStartClass(booking)
                                }}
                                disabled={booking.status === "pending"}
                                className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                title={booking.status === "pending" ? "Confirm booking first" : "Start video class"}
                              >
                                <Video className="h-3 w-3 mr-1" />
                                Start Class
                              </Button>
                            )}
                            {(booking.status === "confirmed" ||
                              booking.status === "pending" ||
                              booking.status === "completed") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedBookingForChat(booking)
                                  setActiveTab("messages")
                                }}
                                className="text-xs"
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Chat
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Earnings Overview</CardTitle>
                <CardDescription className="text-sm">Your teaching income and payment history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <h3 className="text-xl sm:text-2xl font-bold text-green-600">₹{totalEarnings}</h3>
                    <p className="text-sm text-green-700">Total Earnings</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-xl sm:text-2xl font-bold text-blue-600">
                      {bookings.filter((b) => b.status === "completed").length}
                    </h3>
                    <p className="text-sm text-blue-700">Completed Classes</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <h3 className="text-xl sm:text-2xl font-bold text-purple-600">
                      ₹
                      {bookings.length > 0
                        ? Math.round(totalEarnings / bookings.filter((b) => b.status === "completed").length || 0)
                        : 0}
                    </h3>
                    <p className="text-sm text-purple-700">Avg. per Class</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 sm:space-y-6">
            {selectedBookingForChat ? (
              <div className="max-w-4xl mx-auto">
                <ChatInterface
                  booking={{
                    ...selectedBookingForChat,
                    teacher_name: teacher?.name || "",
                    teacher_skill: selectedBookingForChat.teacher_skill,
                  }}
                  currentUserId={user?.id || ""}
                  currentUserRole="teacher"
                  currentUserEmail={user?.email || ""}
                  onClose={() => setSelectedBookingForChat(null)}
                />
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">Student Conversations</CardTitle>
                  <CardDescription className="text-sm">Chat with your students about their bookings</CardDescription>
                </CardHeader>
                <CardContent>
                  {bookings.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <MessageSquare className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Conversations Yet</h3>
                      <p className="text-gray-600 text-sm sm:text-base px-4">
                        Your student conversations will appear here once you have bookings.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 sm:space-y-4">
                      {bookings
                        .filter(
                          (booking) =>
                            booking.status === "confirmed" ||
                            booking.status === "pending" ||
                            booking.status === "completed",
                        )
                        .slice(0, 10)
                        .map((booking) => (
                          <div
                            key={booking.id}
                            className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                            onClick={() => setSelectedBookingForChat(booking)}
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                <AvatarFallback>{booking.learner_name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium text-sm sm:text-base">{booking.learner_name}</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {booking.teacher_skill} • {new Intl.DateTimeFormat("en-US", { timeZone: "UTC" }).format(new Date(`${booking.booking_date}T00:00:00Z`))}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="capitalize text-xs">
                                {booking.status}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {unreadByBooking[booking.id] && unreadByBooking[booking.id] > 0 && (
                                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-2">
                                    <Bell className="h-3 w-3 mr-1" />
                                    {unreadByBooking[booking.id]}
                                  </Badge>
                                )}
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {selectedBookingForCall && activeClassId && activeRoomId && (
          <VideoCallInterface
            roomId={activeRoomId}
            classId={activeClassId}
            userName={teacher?.name || "Teacher"}
            userRole="teacher"
          onEndCall={handleCallEnd}
          isOpen={isVideoCallOpen}
          onClose={handleCallClose}
            booking={{
              ...selectedBookingForCall,
              teacher_name: teacher?.name || "Teacher",
              teacher_skill: selectedBookingForCall.teacher_skill,
            }}
            currentUserId={user?.id || ""}
            currentUserEmail={user?.email || ""}
          />
        )}
        </main>
      </div>
    </div>
  )
}
