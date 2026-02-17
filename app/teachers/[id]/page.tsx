"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Star, Award, ArrowLeft } from "lucide-react"
import BookingModal from "@/components/booking-modal"
import { supabase } from "@/lib/supabase"

interface DatabaseSkill {
  skill_id: string
  teacher_id: string
  teacher_name: string
  teacher_email: string
  teacher_bio: string
  teacher_photo: string | null
  teacher_rating: number | null
  teacher_status: string
  teacher_experience: string
  skill_name: string
  skill_category: string
  proficiency_level: string
  skill_years_experience: number
  price_per_hour: number
  skill_description: string | null
  is_primary: boolean
}

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

export default function TeacherProfilePage() {
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const teacherId = params?.id
  const initialSkillId = searchParams.get("skillId") || null

  const [skills, setSkills] = useState<SkillCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<SkillCard | null>(null)

  useEffect(() => {
    const fetchTeacherSkills = async () => {
      if (!teacherId) return
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase.from("teacher_skills_view").select("*").eq("teacher_id", teacherId)

        if (error) throw error

        const transformed: SkillCard[] = (data as DatabaseSkill[]).map((db) => ({
          skillId: db.skill_id,
          teacherId: db.teacher_id,
          teacherName: db.teacher_name,
          teacherEmail: db.teacher_email,
          teacherPhoto: db.teacher_photo || "/professional-teacher.png",
          teacherBio: db.teacher_bio,
          teacherRating: db.teacher_rating || 4.5,
          teacherExperience: db.teacher_experience,
          skillName: db.skill_name,
          skillCategory: db.skill_category,
          proficiencyLevel: db.proficiency_level,
          skillYearsExperience: db.skill_years_experience,
          pricePerHour: db.price_per_hour,
          skillDescription: db.skill_description,
          isPrimary: db.is_primary,
          location: "India",
          reviews: Math.floor(Math.random() * 200) + 10,
        }))

        setSkills(transformed)
      } catch (e) {
        console.error("[v0] Error loading teacher profile:", e)
        setError("Failed to load teacher profile. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchTeacherSkills()
  }, [teacherId])

  const primarySkill = useMemo(() => {
    if (skills.length === 0) return null
    if (initialSkillId) {
      const match = skills.find((s) => s.skillId === initialSkillId)
      if (match) return match
    }
    return skills.find((s) => s.isPrimary) || skills[0]
  }, [skills, initialSkillId])

  useEffect(() => {
    if (primarySkill) setSelectedSkill(primarySkill)
  }, [primarySkill])

  const teacher = useMemo(() => {
    if (skills.length === 0) return null
    const s = skills[0]
    return {
      name: s.teacherName,
      email: s.teacherEmail,
      photo: s.teacherPhoto,
      bio: s.teacherBio,
      rating: s.teacherRating,
      experience: s.teacherExperience,
      location: s.location,
      reviews: s.reviews,
    }
  }, [skills])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <div className="flex items-center gap-3">
            <Link href="/marketplace" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Marketplace
            </Link>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-muted-foreground">Loading teacher profile...</div>
          ) : error ? (
            <div className="text-red-500">{error}</div>
          ) : !teacher ? (
            <div className="text-muted-foreground">No data found for this teacher.</div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Left: Teacher summary */}
              <div className="lg:col-span-1">
                <Card className="overflow-hidden border-border/50">
                  <div className="aspect-square">
                    <img
                      src={teacher.photo || "/placeholder.svg?height=600&width=600&query=professional teacher"}
                      alt={teacher.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-2xl">{teacher.name}</CardTitle>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {teacher.rating}
                        <span className="ml-2">({teacher.reviews} reviews)</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {teacher.location}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">{teacher.bio}</div>
                    <div className="text-sm text-muted-foreground flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      {teacher.experience}
                    </div>
                    {selectedSkill && (
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="text-sm font-medium">{selectedSkill.skillName}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {selectedSkill.proficiencyLevel} • {selectedSkill.skillYearsExperience} yrs
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-[#FF6600]">₹{selectedSkill.pricePerHour}</span>
                          <span className="text-xs text-muted-foreground">/hour</span>
                        </div>
                      </div>
                    )}
                    <Button
                      className="w-full bg-[#FF6600] hover:bg-[#FF6600]/90 text-white"
                      onClick={() => setIsBookingModalOpen(true)}
                      disabled={!selectedSkill}
                    >
                      Book Now
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Skills list */}
              <div className="lg:col-span-2">
                <Card className="border-border/50">
                  <CardHeader>
                    <CardTitle>Skills Offered</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {skills.map((s) => {
                      const isActive = selectedSkill?.skillId === s.skillId
                      return (
                        <div
                          key={s.skillId}
                          className={`p-4 rounded-md border transition-colors cursor-pointer ${
                            isActive ? "border-[#FF6600] bg-orange-50/50" : "border-border hover:bg-muted/30"
                          }`}
                          onClick={() => setSelectedSkill(s)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {s.skillCategory}
                                </Badge>
                                {s.isPrimary && (
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-xs">
                                    Primary
                                  </Badge>
                                )}
                              </div>
                              <h3 className="text-lg font-semibold mt-1">{s.skillName}</h3>
                              {s.skillDescription && (
                                <p className="text-sm text-muted-foreground mt-1">{s.skillDescription}</p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                <span className="capitalize">{s.proficiencyLevel}</span>
                                <Separator orientation="vertical" className="h-4" />
                                <span>{s.skillYearsExperience} yrs experience</span>
                              </div>
                            </div>
                            <div className="text-right whitespace-nowrap">
                              <div className="text-xl font-bold text-[#FF6600]">₹{s.pricePerHour}</div>
                              <div className="text-xs text-muted-foreground">per hour</div>
                              <Button
                                size="sm"
                                className="mt-2 bg-[#FF6600] hover:bg-[#FF6600]/90 text-white"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedSkill(s)
                                  setIsBookingModalOpen(true)
                                }}
                              >
                                Book Now
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>

      <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} skill={selectedSkill} />
    </div>
  )
}
