"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, User, Mail, BookOpen, Clock, FileText, Camera, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { submitTeacherApplication } from "@/app/actions/teacher-signup"

export default function TeacherSignupPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    skill: "",
    experience: "",
    bio: "",
    photo: null as File | null,
    rating: "0",
    price_hour: "",
    category: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFormData((prev) => ({ ...prev, photo: file }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const formDataToSend = new FormData()
      formDataToSend.append("name", formData.name)
      formDataToSend.append("email", formData.email)
      formDataToSend.append("skill", formData.skill)
      formDataToSend.append("experience", formData.experience)
      formDataToSend.append("bio", formData.bio)
      formDataToSend.append("rating", formData.rating)
      formDataToSend.append("price_hour", formData.price_hour)
      formDataToSend.append("category", formData.category)
      if (formData.photo) {
        formDataToSend.append("photo", formData.photo)
      }

      const result = await submitTeacherApplication(formDataToSend)

      if (result.success) {
        setFormData({
          name: "",
          email: "",
          skill: "",
          experience: "",
          bio: "",
          photo: null,
          rating: "0",
          price_hour: "",
          category: "",
        })
        alert(result.message)
      } else {
        alert(result.error)
      }
    } catch (error) {
      console.log("[v0] Teacher signup error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 font-serif">Become a Teacher</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Share your expertise and help others learn new skills. Join our community of passionate educators.
            </p>
          </div>
        </div>

        {/* Signup Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-border/50">
            <CardHeader className="text-center pb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-serif">Teacher Registration</CardTitle>
              <CardDescription className="text-base">
                Fill out the form below to start your teaching journey with Hobease
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium flex items-center">
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium flex items-center">
                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {/* Skill Field */}
                <div className="space-y-2">
                  <Label htmlFor="skill" className="text-sm font-medium flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                    Primary Skill
                  </Label>
                  <Select value={formData.skill} onValueChange={(value) => handleInputChange("skill", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your primary skill" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="web-development">Web Development</SelectItem>
                      <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                      <SelectItem value="graphic-design">Graphic Design</SelectItem>
                      <SelectItem value="photography">Photography</SelectItem>
                      <SelectItem value="data-science">Data Science</SelectItem>
                      <SelectItem value="music-production">Music Production</SelectItem>
                      <SelectItem value="writing">Writing & Content</SelectItem>
                      <SelectItem value="business">Business & Finance</SelectItem>
                      <SelectItem value="languages">Languages</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Experience Field */}
                <div className="space-y-2">
                  <Label htmlFor="experience" className="text-sm font-medium flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    Years of Experience
                  </Label>
                  <Select value={formData.experience} onValueChange={(value) => handleInputChange("experience", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-2">1-2 years</SelectItem>
                      <SelectItem value="3-5">3-5 years</SelectItem>
                      <SelectItem value="6-10">6-10 years</SelectItem>
                      <SelectItem value="10+">10+ years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Field */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium flex items-center">
                    <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
                    Category
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select your teaching category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="creative">Creative Arts</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="language">Language</SelectItem>
                      <SelectItem value="music">Music</SelectItem>
                      <SelectItem value="fitness">Fitness & Health</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price per Hour Field */}
                <div className="space-y-2">
                  <Label htmlFor="price_hour" className="text-sm font-medium flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    Price per Hour (₹)
                  </Label>
                  <Input
                    id="price_hour"
                    type="number"
                    placeholder="Enter your hourly rate in rupees"
                    value={formData.price_hour}
                    onChange={(e) => handleInputChange("price_hour", e.target.value)}
                    required
                    min="100"
                    max="10000"
                    className="h-11"
                  />
                  <p className="text-xs text-muted-foreground">
                    Set your hourly teaching rate (minimum ₹100, maximum ₹10,000)
                  </p>
                </div>

                {/* Bio Field */}
                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-medium flex items-center">
                    <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                    Short Bio
                  </Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself, your expertise, and why you want to teach..."
                    value={formData.bio}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    required
                    rows={4}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Minimum 50 characters. This will be shown on your teacher profile.
                  </p>
                </div>

                {/* Photo Upload Field */}
                <div className="space-y-2">
                  <Label htmlFor="photo" className="text-sm font-medium flex items-center">
                    <Camera className="mr-2 h-4 w-4 text-muted-foreground" />
                    Profile Photo
                  </Label>
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="h-11 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                      />
                    </div>
                    {formData.photo && <div className="text-sm text-muted-foreground">{formData.photo.name}</div>}
                  </div>
                  <p className="text-xs text-muted-foreground">Upload a professional photo (JPG, PNG, max 5MB)</p>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-5 w-5" />
                        Submit Application
                      </>
                    )}
                  </Button>
                </div>

                {/* Terms */}
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  By submitting this form, you agree to our{" "}
                  <a href="#" className="text-primary hover:underline">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                  . We'll review your application and contact you within 2-3 business days.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
