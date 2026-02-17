"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar, Clock, Plus, Trash2, AlertCircle } from "lucide-react"
import { Switch } from "@/components/ui/switch"

interface WeeklyAvailability {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available: boolean
}

interface AvailabilityException {
  id: string
  exception_date: string
  start_time: string | null
  end_time: string | null
  is_available: boolean
  reason: string | null
}

interface AvailabilityManagerProps {
  teacherId: string
}

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
  "18:30",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
]

export function AvailabilityManager({ teacherId }: AvailabilityManagerProps) {
  const [weeklyAvailability, setWeeklyAvailability] = useState<WeeklyAvailability[]>([])
  const [exceptions, setExceptions] = useState<AvailabilityException[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingWeekly, setIsAddingWeekly] = useState(false)
  const [isAddingException, setIsAddingException] = useState(false)

  const [newWeekly, setNewWeekly] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  })

  const [newException, setNewException] = useState({
    exception_date: "",
    start_time: "",
    end_time: "",
    is_available: false,
    reason: "",
  })

  useEffect(() => {
    console.log("[v0] AvailabilityManager mounted with teacherId:", teacherId)
    fetchAvailability()
  }, [teacherId])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching availability for teacher:", teacherId)

      // Fetch weekly availability
      const { data: weeklyData, error: weeklyError } = await supabase
        .from("teacher_availability")
        .select("*")
        .eq("teacher_id", teacherId)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true })

      console.log("[v0] Weekly availability fetch result:", { data: weeklyData, error: weeklyError })
      if (weeklyError) throw weeklyError
      setWeeklyAvailability(weeklyData || [])

      // Fetch exceptions
      const { data: exceptionsData, error: exceptionsError } = await supabase
        .from("teacher_availability_exceptions")
        .select("*")
        .eq("teacher_id", teacherId)
        .gte("exception_date", new Date().toISOString().split("T")[0])
        .order("exception_date", { ascending: true })

      console.log("[v0] Exceptions fetch result:", { data: exceptionsData, error: exceptionsError })
      if (exceptionsError) throw exceptionsError
      setExceptions(exceptionsData || [])
    } catch (error) {
      console.error("[v0] Error fetching availability:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddWeeklyAvailability = async () => {
    try {
      console.log("[v0] Attempting to add weekly availability:", {
        teacher_id: teacherId,
        day_of_week: newWeekly.day_of_week,
        start_time: newWeekly.start_time,
        end_time: newWeekly.end_time,
      })

      const { data, error } = await supabase
        .from("teacher_availability")
        .insert({
          teacher_id: teacherId,
          day_of_week: newWeekly.day_of_week,
          start_time: newWeekly.start_time,
          end_time: newWeekly.end_time,
          is_available: true,
        })
        .select()
        .single()

      console.log("[v0] Weekly availability insert result:", { data, error })

      if (error) {
        console.error("[v0] Insert error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log("[v0] Successfully added weekly availability:", data)
      setWeeklyAvailability([...weeklyAvailability, data])
      setIsAddingWeekly(false)
      setNewWeekly({ day_of_week: 1, start_time: "09:00", end_time: "17:00" })
    } catch (error) {
      console.error("[v0] Error adding weekly availability:", error)
      alert("Failed to add availability. Please try again.")
    }
  }

  const handleDeleteWeeklyAvailability = async (id: string) => {
    if (!confirm("Are you sure you want to delete this availability slot?")) return

    try {
      const { error } = await supabase.from("teacher_availability").delete().eq("id", id)

      if (error) throw error

      setWeeklyAvailability(weeklyAvailability.filter((a) => a.id !== id))
    } catch (error) {
      console.error("[v0] Error deleting availability:", error)
      alert("Failed to delete availability. Please try again.")
    }
  }

  const handleAddException = async () => {
    if (!newException.exception_date) {
      alert("Please select a date")
      return
    }

    // Validate times if marking as available
    if (newException.is_available && (!newException.start_time || !newException.end_time)) {
      alert("Please specify start and end times for available periods")
      return
    }

    try {
      console.log("[v0] Attempting to add exception:", {
        teacher_id: teacherId,
        exception_date: newException.exception_date,
        start_time: newException.is_available ? newException.start_time : null,
        end_time: newException.is_available ? newException.end_time : null,
        is_available: newException.is_available,
        reason: newException.reason || null,
      })

      const { data, error } = await supabase
        .from("teacher_availability_exceptions")
        .insert({
          teacher_id: teacherId,
          exception_date: newException.exception_date,
          start_time: newException.is_available ? newException.start_time : null,
          end_time: newException.is_available ? newException.end_time : null,
          is_available: newException.is_available,
          reason: newException.reason || null,
        })
        .select()
        .single()

      console.log("[v0] Exception insert result:", { data, error })

      if (error) {
        console.error("[v0] Insert error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        })
        throw error
      }

      console.log("[v0] Successfully added exception:", data)
      setExceptions([...exceptions, data])
      setIsAddingException(false)
      setNewException({
        exception_date: "",
        start_time: "",
        end_time: "",
        is_available: false,
        reason: "",
      })
    } catch (error) {
      console.error("[v0] Error adding exception:", error)
      alert("Failed to add exception. Please try again.")
    }
  }

  const handleDeleteException = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exception?")) return

    try {
      const { error } = await supabase.from("teacher_availability_exceptions").delete().eq("id", id)

      if (error) throw error

      setExceptions(exceptions.filter((e) => e.id !== id))
    } catch (error) {
      console.error("[v0] Error deleting exception:", error)
      alert("Failed to delete exception. Please try again.")
    }
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = Number.parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (loading) {
    return <div className="text-center py-8">Loading availability...</div>
  }

  return (
    <div className="space-y-6">
      {/* Weekly Availability */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Availability
              </CardTitle>
              <CardDescription>Set your regular weekly schedule</CardDescription>
            </div>
            <Button onClick={() => setIsAddingWeekly(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Time Slot
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {weeklyAvailability.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No weekly availability set. Add your first time slot to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {DAYS_OF_WEEK.map((day, dayIndex) => {
                const daySlots = weeklyAvailability.filter((a) => a.day_of_week === dayIndex)
                if (daySlots.length === 0) return null

                return (
                  <div key={dayIndex} className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">{day}</h4>
                    <div className="space-y-2">
                      {daySlots.map((slot) => (
                        <div key={slot.id} className="flex items-center justify-between bg-muted/30 p-3 rounded">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteWeeklyAvailability(slot.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exceptions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Exceptions & Blocked Dates
              </CardTitle>
              <CardDescription>Override your regular schedule for specific dates</CardDescription>
            </div>
            <Button onClick={() => setIsAddingException(true)} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Exception
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {exceptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No exceptions set. Your regular weekly schedule will apply.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exceptions.map((exception) => (
                <div key={exception.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={exception.is_available ? "default" : "destructive"}>
                          {exception.is_available ? "Available" : "Blocked"}
                        </Badge>
                        <span className="text-sm font-medium">
                          {new Date(exception.exception_date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {exception.is_available && exception.start_time && exception.end_time && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {formatTime(exception.start_time)} - {formatTime(exception.end_time)}
                        </div>
                      )}
                      {exception.reason && <p className="text-sm text-muted-foreground mt-2">{exception.reason}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteException(exception.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Weekly Availability Dialog */}
      <Dialog open={isAddingWeekly} onOpenChange={setIsAddingWeekly}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Weekly Availability</DialogTitle>
            <DialogDescription>Set a recurring time slot for a specific day of the week</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={newWeekly.day_of_week.toString()}
                onValueChange={(value) => setNewWeekly({ ...newWeekly, day_of_week: Number.parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day, index) => (
                    <SelectItem key={index} value={index.toString()}>
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Select
                  value={newWeekly.start_time}
                  onValueChange={(value) => setNewWeekly({ ...newWeekly, start_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Select
                  value={newWeekly.end_time}
                  onValueChange={(value) => setNewWeekly({ ...newWeekly, end_time: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {formatTime(time)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingWeekly(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddWeeklyAvailability}>Add Availability</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Exception Dialog */}
      <Dialog open={isAddingException} onOpenChange={setIsAddingException}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Exception</DialogTitle>
            <DialogDescription>Block a date or add special availability for a specific date</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input
                type="date"
                value={newException.exception_date}
                onChange={(e) => setNewException({ ...newException, exception_date: e.target.value })}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newException.is_available}
                onCheckedChange={(checked) => setNewException({ ...newException, is_available: checked })}
              />
              <Label>Mark as available (otherwise will be blocked)</Label>
            </div>
            {newException.is_available && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Select
                    value={newException.start_time}
                    onValueChange={(value) => setNewException({ ...newException, start_time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Select
                    value={newException.end_time}
                    onValueChange={(value) => setNewException({ ...newException, end_time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map((time) => (
                        <SelectItem key={time} value={time}>
                          {formatTime(time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Reason (Optional)</Label>
              <Textarea
                value={newException.reason}
                onChange={(e) => setNewException({ ...newException, reason: e.target.value })}
                placeholder="e.g., Holiday, Personal day, Special event"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingException(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddException}>Add Exception</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
