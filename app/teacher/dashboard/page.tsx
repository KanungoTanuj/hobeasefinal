"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@/lib/supabase"
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
      const supabase = createClientComponentClient()

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        router.push("/auth")
        return
      }

      setUser(session.user)
      await fetchTeacherData(session.user.email!)
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

  const fetchTeacherData = async (email: string) => {
    try {
      console.log("[v0] Fetching teacher data for email:", email)

      const supabase = createClientComponentClient()

      const { data: teacherData, error: teacherError } = await supabase
        .from("Teachers")
        .select("id, name, email, skill, experience, bio, photo_url")
        .eq("email", email)
        .limit(1)
        .single()

      console.log("[v0] Teacher query result:", { data: teacherData, error: teacherError })

      if (teacherError) {
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
        setBookings(bookingsData || [])
        console.log("[v0] Set bookings state with", bookingsData?.length || 0, "bookings")
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

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

  const handleCallEnd = () => {
    setIsVideoCallOpen(false)
    setSelectedBookingForCall(null)
    setActiveClassId(null)
    setActiveRoomId(null)
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">Welcome back, {teacher.name || "Teacher"}!</p>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="outline" onClick={() => router.push("/")} className="flex items-center gap-2 text-sm">
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Home</span>
              </Button>
              <Badge className="bg-blue-100 text-blue-800 border-0 text-xs sm:text-sm">
                <span className="sm:hidden">Active</span>
                <span className="hidden sm:inline">Active Teacher</span>
              </Badge>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          {isMobile ? (
            <div className="space-y-2">
              <TabsList className="grid w-full grid-cols-4 h-auto">
                <TabsTrigger value="overview" className="flex flex-col items-center space-y-1 py-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="profile" className="flex flex-col items-center space-y-1 py-2">
                  <User className="h-4 w-4" />
                  <span className="text-xs">Profile</span>
                </TabsTrigger>
                <TabsTrigger value="skills" className="flex flex-col items-center space-y-1 py-2">
                  <Award className="h-4 w-4" />
                  <span className="text-xs">Skills</span>
                </TabsTrigger>
                <TabsTrigger value="classes" className="flex flex-col items-center space-y-1 py-2">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs">Classes</span>
                </TabsTrigger>
              </TabsList>
              <TabsList className="grid w-full grid-cols-3 h-auto">
                <TabsTrigger value="students" className="flex flex-col items-center space-y-1 py-2">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Students</span>
                </TabsTrigger>
                <TabsTrigger value="earnings" className="flex flex-col items-center space-y-1 py-2">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs">Earnings</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex flex-col items-center space-y-1 py-2">
                  <MessageSquare className="h-4 w-4" />
                  <span className="text-xs">Messages</span>
                </TabsTrigger>
              </TabsList>
            </div>
          ) : (
            <TabsList className="grid w-full grid-cols-7 lg:w-fit">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="skills" className="flex items-center gap-2">
                <Award className="h-4 w-4" />
                <span className="hidden sm:inline">Skills</span>
              </TabsTrigger>
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Classes</span>
              </TabsTrigger>
              <TabsTrigger value="students" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Students</span>
              </TabsTrigger>
              <TabsTrigger value="earnings" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                <span className="hidden sm:inline">Earnings</span>
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Bookings</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{bookings.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Upcoming Classes</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{upcomingBookings.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Total Earnings</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">₹{totalEarnings}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium">Profile Score</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold">{Math.round(getProfileCompletion())}%</div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">Profile Completion</CardTitle>
                <CardDescription className="text-sm">Complete your profile to attract more students</CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={getProfileCompletion()} className="mb-4" />
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                  <span className="text-sm text-gray-600">{Math.round(getProfileCompletion())}% Complete</span>
                  <Button variant="outline" size="sm" onClick={() => router.push("/teacher/profile")}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
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
                            {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
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
                                onClick={() => setSelectedBookingForChat(booking)}
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
                                  {booking.teacher_skill} • {new Date(booking.booking_date).toLocaleDateString()}
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
            onClose={handleCallEnd}
          />
        )}
      </div>
    </div>
  )
}
