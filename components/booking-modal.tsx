"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, CheckCircle, Star, User, Mail, Award } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface SkillCard {
  skillId: string
  teacherId: string
  teacherName: string
  teacherEmail: string
  teacherPhoto: string
  teacherBio: string
  teacherRating: number
  teacherExperience: string
  skillName: string
  skillCategory: string
  proficiencyLevel: string
  skillYearsExperience: number
  pricePerHour: number
  skillDescription: string | null
  isPrimary: boolean
  location: string
  reviews: number
}

interface BookingModalProps {
  isOpen: boolean
  onClose: () => void
  skill: SkillCard | null
}

declare global {
  interface Window {
    Razorpay?: any
  }
}

export default function BookingModal({ isOpen, onClose, skill }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [learnerName, setLearnerName] = useState("")
  const [learnerEmail, setLearnerEmail] = useState("")
  const [showSuccess, setShowSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [loadingTimeSlots, setLoadingTimeSlots] = useState(false)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [loadingDates, setLoadingDates] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("[v0] Auth session error:", error)
          setUser(null)
        } else {
          const currentUser = session?.user || null
          setUser(currentUser)

          if (currentUser) {
            const displayName =
              currentUser.user_metadata?.full_name ||
              currentUser.user_metadata?.name ||
              currentUser.email?.split("@")[0] ||
              ""
            setLearnerName(displayName)
            setLearnerEmail(currentUser.email || "")
            console.log("[v0] User authenticated:", { id: currentUser.id, email: currentUser.email })
          } else {
            console.log("[v0] No authenticated user found")
            setLearnerName("")
            setLearnerEmail("")
          }
        }
      } catch (error) {
        console.error("[v0] Error checking auth:", error)
        setUser(null)
        setLearnerName("")
        setLearnerEmail("")
      } finally {
        setAuthLoading(false)
      }
    }

    if (isOpen) {
      checkAuth()

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("[v0] Auth state changed:", event, session?.user?.id)
        const currentUser = session?.user || null
        setUser(currentUser)

        if (currentUser) {
          const displayName =
            currentUser.user_metadata?.full_name ||
            currentUser.user_metadata?.name ||
            currentUser.email?.split("@")[0] ||
            ""
          setLearnerName(displayName)
          setLearnerEmail(currentUser.email || "")
        } else {
          setLearnerName("")
          setLearnerEmail("")
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [isOpen])

  const timeSlots = [
    "09:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "01:00 PM",
    "02:00 PM",
    "03:00 PM",
    "04:00 PM",
    "05:00 PM",
    "06:00 PM",
    "07:00 PM",
    "08:00 PM",
  ]

  const fetchAvailableDates = async (teacherId: string) => {
    setLoadingDates(true)
    try {
      console.log("[v0] Fetching available dates for teacher:", teacherId)

      const { data: weeklyAvailability, error: availError } = await supabase
        .from("teacher_availability")
        .select("day_of_week, is_available")
        .eq("teacher_id", teacherId)
        .eq("is_available", true)

      if (availError) {
        console.error("[v0] Error fetching weekly availability:", availError)
      }

      const today = new Date()
      const futureDate = new Date()
      futureDate.setDate(today.getDate() + 14)

      const { data: exceptions, error: exceptError } = await supabase
        .from("teacher_availability_exceptions")
        .select("exception_date, is_available")
        .eq("teacher_id", teacherId)
        .gte("exception_date", today.toISOString().split("T")[0])
        .lte("exception_date", futureDate.toISOString().split("T")[0])

      if (exceptError) {
        console.error("[v0] Error fetching exceptions:", exceptError)
      }

      const exceptionMap = new Map<string, boolean>()
      if (exceptions) {
        exceptions.forEach((exc) => {
          exceptionMap.set(exc.exception_date, exc.is_available)
        })
      }

      const availableDaysOfWeek = new Set<number>()
      if (weeklyAvailability) {
        weeklyAvailability.forEach((avail) => {
          availableDaysOfWeek.add(avail.day_of_week)
        })
      }

      const dates: string[] = []
      for (let i = 1; i <= 14; i++) {
        const date = new Date()
        date.setDate(date.getDate() + i)
        const dateStr = date.toISOString().split("T")[0]
        const dayOfWeek = date.getDay()

        if (exceptionMap.has(dateStr)) {
          if (exceptionMap.get(dateStr)) {
            dates.push(dateStr)
          }
        } else if (availableDaysOfWeek.has(dayOfWeek)) {
          dates.push(dateStr)
        }
      }

      console.log("[v0] Available dates:", dates)
      setAvailableDates(dates)
    } catch (error) {
      console.error("[v0] Error fetching available dates:", error)
      const fallbackDates = Array.from({ length: 14 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() + i + 1)
        return date.toISOString().split("T")[0]
      })
      setAvailableDates(fallbackDates)
    } finally {
      setLoadingDates(false)
    }
  }

  useEffect(() => {
    if (isOpen && skill) {
      fetchAvailableDates(skill.teacherId)
    } else {
      setAvailableDates([])
    }
  }, [isOpen, skill])

  const checkAvailableTimeSlots = async (date: string, teacherId: string) => {
    if (!date || !teacherId) return

    setLoadingTimeSlots(true)
    try {
      console.log("[v0] Checking availability for teacher", teacherId, "on date", date)

      const { data: teacherData, error: teacherError } = await supabase
        .from("Teachers")
        .select("auth_id")
        .eq("id", teacherId)
        .single()

      if (teacherError) {
        console.error("[v0] Error fetching teacher for availability check:", teacherError)
        setAvailableTimeSlots(timeSlots)
        return
      }

      const selectedDateObj = new Date(date + "T00:00:00")
      const dayOfWeek = selectedDateObj.getDay()

      const { data: weeklyAvailability, error: availError } = await supabase
        .from("teacher_availability")
        .select("start_time, end_time")
        .eq("teacher_id", teacherId)
        .eq("day_of_week", dayOfWeek)
        .eq("is_available", true)

      if (availError) {
        console.error("[v0] Error fetching weekly availability:", availError)
      }

      const { data: exceptions, error: exceptError } = await supabase
        .from("teacher_availability_exceptions")
        .select("*")
        .eq("teacher_id", teacherId)
        .eq("exception_date", date)

      if (exceptError) {
        console.error("[v0] Error fetching exceptions:", exceptError)
      }

      let availableSlots: string[] = []

      if (exceptions && exceptions.length > 0) {
        const exception = exceptions[0]
        if (exception.is_available && exception.start_time && exception.end_time) {
          availableSlots = timeSlots.filter((slot) => {
            const slotTime = slot.replace(" AM", "").replace(" PM", "")
            const [hours, minutes] = slotTime.split(":")
            let hour = Number.parseInt(hours)
            if (slot.includes("PM") && hour !== 12) hour += 12
            if (slot.includes("AM") && hour === 12) hour = 0
            const slotTimeStr = `${hour.toString().padStart(2, "0")}:${minutes}:00`

            return slotTimeStr >= exception.start_time && slotTimeStr < exception.end_time
          })
        } else {
          availableSlots = []
        }
      } else if (weeklyAvailability && weeklyAvailability.length > 0) {
        availableSlots = timeSlots.filter((slot) => {
          const slotTime = slot.replace(" AM", "").replace(" PM", "")
          const [hours, minutes] = slotTime.split(":")
          let hour = Number.parseInt(hours)
          if (slot.includes("PM") && hour !== 12) hour += 12
          if (slot.includes("AM") && hour === 12) hour = 0
          const slotTimeStr = `${hour.toString().padStart(2, "0")}:${minutes}:00`

          return weeklyAvailability.some((avail) => {
            return slotTimeStr >= avail.start_time && slotTimeStr < avail.end_time
          })
        })
      } else {
        availableSlots = timeSlots
      }

      const { data: existingBookings, error } = await supabase
        .from("bookings")
        .select("booking_time")
        .eq("teacher_auth_id", teacherData.auth_id)
        .eq("booking_date", date)
        .in("status", ["pending", "confirmed"])

      if (error) {
        console.error("[v0] Error checking bookings:", error)
        setAvailableTimeSlots(availableSlots)
        return
      }

      const bookedTimes =
        existingBookings?.map((booking) => {
          const [hours, minutes] = booking.booking_time.split(":")
          const hour = Number.parseInt(hours)
          const ampm = hour >= 12 ? "PM" : "AM"
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
          return `${displayHour.toString().padStart(2, "0")}:${minutes} ${ampm}`
        }) || []

      console.log("[v0] Booked times:", bookedTimes)

      const available = availableSlots.filter((slot) => !bookedTimes.includes(slot))
      console.log("[v0] Available time slots:", available)

      setAvailableTimeSlots(available)
    } catch (error) {
      console.error("[v0] Error checking availability:", error)
      setAvailableTimeSlots(timeSlots)
    } finally {
      setLoadingTimeSlots(false)
    }
  }

  useEffect(() => {
    if (selectedDate && skill) {
      checkAvailableTimeSlots(selectedDate, skill.teacherId)
      setSelectedTime("")
    } else {
      setAvailableTimeSlots([])
    }
  }, [selectedDate, skill])

  const loadRazorpayScript = async () => {
    if (window.Razorpay) return true
    return new Promise<boolean>((resolve) => {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const createBooking = async (params: {
    groupBookingId: string
    teacherAuthId: string
    learnerAuthId: string
    learnerId: string
    teacherId: string
  }) => {
    const { groupBookingId, teacherAuthId, learnerAuthId, learnerId, teacherId } = params
    const finalName =
      user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || learnerName
    const finalEmail = user?.email || learnerEmail

    const bookingData = {
      learner_id: learnerId,
      teacher_id: teacherId,
      teacher_auth_id: teacherAuthId,
      learner_auth_id: learnerAuthId,
      teacher_name: skill!.teacherName,
      teacher_skill: skill!.skillName,
      learner_name: finalName,
      learner_email: finalEmail,
      booking_date: selectedDate,
      booking_time: normalizeTo24h(selectedTime),
      price_per_hour: skill!.pricePerHour,
      status: "confirmed",
      group_booking_id: groupBookingId,
      max_participants: 1,
      current_participants: 1,
      is_group_leader: true,
    }

    console.log("[v0] Creating booking payload:", { ...bookingData, learner_email: "[redacted]" })

    const { data, error } = await supabase.from("bookings").insert([bookingData]).select()
    if (error) {
      console.error("[v0] Supabase error on insert:", error)
      throw error
    }
    console.log("[v0] Booking created:", data)
  }

  const startRazorpayPayment = async (args: {
    teacherAuthId: string
    learnerAuthId: string
    learnerId: string
    teacherId: string
    groupBookingId: string
  }) => {
    if (!skill) throw new Error("Missing skill")
    const ok = await loadRazorpayScript()
    if (!ok) throw new Error("Failed to load Razorpay")

    // Create order on server (amount in paise)
    const orderRes = await fetch("/api/payments/razorpay/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.max(1, Math.round(skill.pricePerHour * 100)), // INR paise
        currency: "INR",
        receipt: `booking-${args.groupBookingId}`,
        notes: {
          teacher_id: args.teacherId,
          learner_id: args.learnerId,
          group_booking_id: args.groupBookingId,
        },
      }),
    })
    if (!orderRes.ok) {
      const msg = await orderRes.text()
      throw new Error(`Order creation failed: ${msg}`)
    }
    const { orderId, keyId } = await orderRes.json()

    const options = {
      key: keyId,
      amount: Math.round(skill.pricePerHour * 100),
      currency: "INR",
      name: "Booking Payment",
      description: `${skill.skillName} with ${skill.teacherName}`,
      order_id: orderId,
      prefill: {
        name: user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || learnerName,
        email: user?.email || learnerEmail,
      },
      notes: {
        group_booking_id: args.groupBookingId,
      },
      handler: async (response: any) => {
        try {
          console.log("[v0] Razorpay handler response:", response)
          // Verify signature on server
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
            }),
          })
          const verifyJson = await verifyRes.json()
          if (!verifyRes.ok || !verifyJson.valid) {
            throw new Error("Payment verification failed")
          }

          // Create booking only after successful verification
          await createBooking({
            groupBookingId: args.groupBookingId,
            teacherAuthId: args.teacherAuthId,
            learnerAuthId: args.learnerAuthId,
            learnerId: args.learnerId,
            teacherId: args.teacherId,
          })
          setShowSuccess(true)
        } catch (err) {
          console.error("[v0] Payment verify/create booking error:", err)
          alert("Payment verification failed. You were not charged. Please try again.")
        } finally {
          setIsLoading(false)
        }
      },
      modal: {
        ondismiss: () => {
          console.log("[v0] Razorpay modal dismissed")
          setIsLoading(false)
        },
      },
      theme: { color: "#0ea5e9" },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const handleConfirmBooking = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    const currentUser = session?.user
    if (!currentUser) {
      alert("Your session has expired. Please sign in again.")
      window.location.href = "/auth"
      return
    }

    const finalName =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      currentUser.email?.split("@")[0] ||
      learnerName
    const finalEmail = currentUser.email || learnerEmail

    if (!selectedDate || !selectedTime || !skill || !finalName || !finalEmail) return

    setIsLoading(true)

    try {
      console.log("[v0] Fetching teacher auth_id for teacher ID:", skill.teacherId)

      const { data: teacherData, error: teacherError } = await supabase
        .from("Teachers")
        .select("auth_id")
        .eq("id", skill.teacherId)
        .single()

      if (teacherError) {
        console.error("[v0] Error fetching teacher auth_id:", teacherError)
        throw new Error("Could not find teacher information")
      }

      const teacherAuthId = teacherData.auth_id
      const learnerAuthId = currentUser.id

      let { data: learnerData, error: learnerError } = await supabase
        .from("learners")
        .select("id")
        .eq("auth_id", learnerAuthId)
        .single()

      if (learnerError && (learnerError as any).code === "PGRST116") {
        const { data: newLearner, error: createError } = await supabase
          .from("learners")
          .insert([{ auth_id: learnerAuthId, name: finalName, email: finalEmail }])
          .select("id")
          .single()
        if (createError) {
          console.error("[v0] Error creating learner:", createError)
          throw new Error("Could not create learner record")
        }
        learnerData = newLearner
      } else if (learnerError) {
        console.error("[v0] Error fetching learner:", learnerError)
        throw new Error("Could not find learner information")
      }

      const learnerId = learnerData.id
      const teacherId = skill.teacherId

      // Double-check time slot availability
      const { data: conflictCheck, error: conflictError } = await supabase
        .from("bookings")
        .select("id")
        .eq("teacher_auth_id", teacherAuthId)
        .eq("booking_date", selectedDate)
        .eq("booking_time", normalizeTo24h(selectedTime))
        .in("status", ["pending", "confirmed"])

      if (conflictError) {
        console.error("[v0] Error checking for conflicts:", conflictError)
        throw conflictError
      }
      if (conflictCheck && conflictCheck.length > 0) {
        alert("This time slot has just been booked by someone else. Please select a different time.")
        await checkAvailableTimeSlots(selectedDate, skill.teacherId)
        setSelectedTime("")
        setIsLoading(false)
        return
      }

      // Always generate a group id up-front to satisfy NOT NULL and for payment notes
      const groupBookingId = generateUuidV4()
      console.log("[v0] groupBookingId for this flow:", groupBookingId)

      // If Razorpay is configured on server, initiate payment flow
      await startRazorpayPayment({
        teacherAuthId,
        learnerAuthId,
        learnerId,
        teacherId,
        groupBookingId,
      })
      // startRazorpayPayment will set loading=false internally
      return

      // Fallback: create booking directly without payment
      await createBooking({
        groupBookingId,
        teacherAuthId,
        learnerAuthId,
        learnerId,
        teacherId,
      })
      setShowSuccess(true)
    } catch (error) {
      console.error("[v0] Booking failed:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred. Please try again."
      alert(`Booking failed: ${errorMessage}`)
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedDate("")
    setSelectedTime("")
    setLearnerName("")
    setLearnerEmail("")
    setShowSuccess(false)
    onClose()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const generateUuidV4 = () => {
    // Prefer native crypto.randomUUID when available
    if (typeof crypto !== "undefined" && typeof (crypto as any).randomUUID === "function") {
      return (crypto as any).randomUUID()
    }
    // RFC4122 v4 fallback
    const rnd = (len = 16) => Array.from({ length: len }, () => Math.floor(Math.random() * 256))
    const bytes = rnd()
    // Set version and variant bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`
  }

  const normalizeTo24h = (timeValue: string) => {
    // Accepts "HH:MM AM/PM", "HH:MM", or "HH:MM:SS"
    if (!timeValue) return timeValue
    const hasMeridiem = timeValue.toUpperCase().includes("AM") || timeValue.toUpperCase().includes("PM")
    if (hasMeridiem) {
      const [time, modifierRaw] = timeValue.split(" ")
      const modifier = modifierRaw?.toUpperCase() === "PM" ? "PM" : "AM"
      const [h, m] = time.split(":")
      let hoursNum = Number.parseInt(h, 10)
      if (modifier === "AM" && hoursNum === 12) hoursNum = 0
      if (modifier === "PM" && hoursNum !== 12) hoursNum += 12
      return `${hoursNum.toString().padStart(2, "0")}:${m}:00`
    }
    // Already in 24h or partial, ensure seconds
    const parts = timeValue.split(":")
    if (parts.length === 2) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:00`
    }
    if (parts.length === 3) {
      return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}:${parts[2].padStart(2, "0")}`
    }
    return timeValue
  }

  if (!skill) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        {!showSuccess ? (
          <>
            <DialogHeader className="pb-4">
              <DialogTitle className="text-lg sm:text-xl font-bold text-foreground">Book a Session</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Card className="border-border/50">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center space-x-3">
                    <img
                      src={skill.teacherPhoto || "/placeholder.svg"}
                      alt={skill.teacherName}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">{skill.skillName}</h3>
                      <p className="text-xs sm:text-sm text-secondary truncate">by {skill.teacherName}</p>
                      <div className="flex items-center mt-1 flex-wrap gap-1">
                        <div className="flex items-center">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                          <span className="text-xs text-muted-foreground">{skill.teacherRating}</span>
                        </div>
                        <div className="flex items-center">
                          <Award className="h-3 w-3 text-muted-foreground ml-2 mr-1" />
                          <span className="text-xs text-muted-foreground capitalize">{skill.proficiencyLevel}</span>
                        </div>
                        <span className="text-sm font-bold text-primary ml-auto">₹{skill.pricePerHour}/hour</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {authLoading && (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              )}

              {!authLoading && !user && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground text-sm">Your Information</h4>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="learner-name" className="text-xs font-medium text-foreground flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        Full Name
                      </Label>
                      <Input
                        id="learner-name"
                        type="text"
                        placeholder="Enter your full name"
                        value={learnerName}
                        onChange={(e) => setLearnerName(e.target.value)}
                        className="h-8"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="learner-email" className="text-xs font-medium text-foreground flex items-center">
                        <Mail className="h-3 w-3 mr-1" />
                        Email Address
                      </Label>
                      <Input
                        id="learner-email"
                        type="email"
                        placeholder="Enter your email address"
                        value={learnerEmail}
                        onChange={(e) => setLearnerEmail(e.target.value)}
                        className="h-8"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {!authLoading && user && (
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground text-sm">Booking as</h4>
                  <Card className="bg-muted/30 border-border/50">
                    <CardContent className="p-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">
                          {user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0]}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{user.email}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-xs sm:text-sm font-medium text-foreground flex items-center">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Select Date
                  </Label>
                  <Select value={selectedDate} onValueChange={setSelectedDate} disabled={loadingDates}>
                    <SelectTrigger className="h-10 sm:h-12 text-sm">
                      <SelectValue
                        placeholder={
                          loadingDates
                            ? "Loading dates..."
                            : availableDates.length === 0
                              ? "No dates available"
                              : "Choose date"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDates.length > 0 ? (
                        availableDates.map((date) => (
                          <SelectItem key={date} value={date} className="text-sm">
                            {formatDate(date)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-dates" disabled className="text-sm">
                          Teacher has not set availability yet
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time" className="text-xs sm:text-sm font-medium text-foreground flex items-center">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    Select Time
                  </Label>
                  <Select
                    value={selectedTime}
                    onValueChange={setSelectedTime}
                    disabled={!selectedDate || loadingTimeSlots}
                  >
                    <SelectTrigger className="h-10 sm:h-12 text-sm">
                      <SelectValue
                        placeholder={
                          !selectedDate
                            ? "Select date first"
                            : loadingTimeSlots
                              ? "Loading..."
                              : availableTimeSlots.length === 0
                                ? "No slots available"
                                : "Choose time"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {availableTimeSlots.map((time) => (
                        <SelectItem key={time} value={time} className="text-sm">
                          {time}
                        </SelectItem>
                      ))}
                      {selectedDate && !loadingTimeSlots && availableTimeSlots.length === 0 && (
                        <SelectItem value="no-slots" disabled className="text-sm">
                          No available slots for this date
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {selectedDate && selectedTime && (
                <Card className="bg-muted/30 border-border/50">
                  <CardContent className="p-3">
                    <h4 className="font-medium text-foreground mb-2 text-sm">Booking Summary</h4>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Skill:</span>
                        <span className="text-foreground">{skill.skillName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Teacher:</span>
                        <span className="text-foreground">{skill.teacherName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="text-foreground">{formatDate(selectedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time:</span>
                        <span className="text-foreground">{selectedTime}</span>
                      </div>
                      <div className="flex justify-between font-medium pt-2 border-t border-border">
                        <span className="text-foreground">Total:</span>
                        <span className="text-primary">₹{skill.pricePerHour}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1 h-10 sm:h-12 text-sm bg-transparent">
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmBooking}
                  disabled={
                    !selectedDate ||
                    !selectedTime ||
                    (!user && (!learnerName || !learnerEmail)) ||
                    isLoading ||
                    authLoading
                  }
                  className="flex-1 h-10 sm:h-12 text-sm"
                >
                  {isLoading ? "Booking..." : "Confirm Booking"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-bold text-foreground mb-2">Booking Confirmed!</h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-4">
              Your {skill.skillName} session with {skill.teacherName} has been booked for {formatDate(selectedDate)} at{" "}
              {selectedTime}.
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6">
              You'll receive a confirmation email shortly with session details.
            </p>
            <Button onClick={handleClose} className="w-full h-10 sm:h-12">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
