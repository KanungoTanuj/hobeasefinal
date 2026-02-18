"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientComponentClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Loader2, Upload } from "lucide-react"
import type { User as SupabaseUser } from "@supabase/supabase-js"

interface Teacher {
  id: string
  name: string
  email: string
  bio: string
  experience: string
  photo_url: string | null
}

export default function TeacherProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [teacher, setTeacher] = useState<Teacher | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    experience: "",
    photo_url: "",
  })
  const [uploading, setUploading] = useState(false)

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

  const fetchTeacherData = async (email: string) => {
    try {
      setLoading(true)
      const supabase = createClientComponentClient()

      const { data: teacherData, error: teacherError } = await supabase
        .from("Teachers")
        .select("id, name, email, bio, experience, photo_url")
        .eq("email", email)
        .limit(1)
        .single()

      if (teacherError) {
        console.error("Error fetching teacher:", teacherError)
        router.push("/teacher/dashboard")
        return
      }

      if (teacherData) {
        setTeacher(teacherData)
        setFormData({
          name: teacherData.name || "",
          bio: teacherData.bio || "",
          experience: teacherData.experience || "",
          photo_url: teacherData.photo_url || "",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Failed to load teacher profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user?.email) return

    try {
      setSaving(true)
      const supabase = createClientComponentClient()

      console.log("[v0] Saving teacher profile with email:", user.email)
      console.log("[v0] Update data:", {
        name: formData.name,
        bio: formData.bio,
        experience: formData.experience,
        photo_url: formData.photo_url,
      })

      const { data, error } = await supabase
        .from("Teachers")
        .update({
          name: formData.name,
          bio: formData.bio,
          experience: formData.experience,
          photo_url: formData.photo_url,
        })
        .eq("email", user.email)
        .select()

      console.log("[v0] Update response - error:", error, "data:", data)

      if (error) throw error

      toast({
        title: "Success",
        description: "Profile updated successfully",
      })

      setTimeout(() => {
        router.push("/teacher/dashboard")
      }, 500)
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploading(true)
      const formDataObj = new FormData()
      formDataObj.append('file', file)

      console.log("[v0] Uploading file:", file.name, file.size)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      console.log("[v0] Upload successful, URL:", data.url)

      setFormData((prev) => ({
        ...prev,
        photo_url: data.url,
      }))

      toast({
        title: "Success",
        description: "Photo uploaded successfully",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Error",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/teacher/dashboard")}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600 mt-1">Update your teacher profile information</p>
          </div>
        </div>

        {/* Profile Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your name, bio, experience, and photo</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Section */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Profile Photo</Label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.photo_url || undefined} />
                  <AvatarFallback>{formData.name?.charAt(0) || "T"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <p className="text-sm text-gray-600">
                    Upload a professional photo (JPG, PNG. Max 5MB)
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      disabled={uploading}
                      className="text-sm cursor-pointer"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Uploading
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Photo
                        </>
                      )}
                    </Button>
                  </div>
                  {formData.photo_url && (
                    <p className="text-xs text-green-600">✓ Photo uploaded successfully</p>
                  )}
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-base font-medium">
                Full Name *
              </Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                required
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-base font-medium">
                Bio
              </Label>
              <Textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell students about yourself, your teaching style, and background..."
                rows={4}
              />
              <p className="text-sm text-gray-500">{formData.bio.length}/500 characters</p>
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <Label htmlFor="experience" className="text-base font-medium">
                Experience
              </Label>
              <Textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                placeholder="Describe your years of experience, qualifications, and achievements..."
                rows={4}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => router.push("/teacher/dashboard")}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
              >
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
