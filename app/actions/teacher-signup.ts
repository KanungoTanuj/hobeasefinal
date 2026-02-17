"use server"

import { supabase } from "@/lib/supabase"

export async function submitTeacherApplication(formData: FormData) {
  try {
    // Extract form data
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const skill = formData.get("skill") as string
    const experience = formData.get("experience") as string
    const bio = formData.get("bio") as string
    const photo = formData.get("photo") as File | null
    const rating = formData.get("rating") as string
    const price_hour = formData.get("price_hour") as string
    const category = formData.get("category") as string

    if (!name || !email || !skill || !experience || !price_hour || !category) {
      return {
        success: false,
        error: "Please fill in all required fields.",
      }
    }

    let photoUrl = null

    // Handle photo upload if provided
    if (photo && photo.size > 0) {
      const fileExt = photo.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("teacher-photos")
        .upload(fileName, photo)

      if (uploadError) {
        console.error("Photo upload error:", uploadError.message)
        return {
          success: false,
          error: uploadError.message.includes("Bucket not found")
            ? "Storage bucket not configured. Please contact support or try again without a photo."
            : `Failed to upload photo: ${uploadError.message}`,
        }
      }

      // Get public URL for the uploaded photo
      const {
        data: { publicUrl },
      } = supabase.storage.from("teacher-photos").getPublicUrl(fileName)

      photoUrl = publicUrl
    }

    const insertData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      skill: skill.trim(),
      experience,
      bio: bio?.trim() || null,
      photo_url: photoUrl,
      rating: Number.parseFloat(rating) || 0,
      price_hour: Number.parseFloat(price_hour),
      category: category.trim(),
    }

    console.log("[v0] Attempting to insert teacher data:", insertData)

    const { data, error } = await supabase.from("Teachers").insert(insertData).select().single()

    if (error) {
      console.error("[v0] Supabase insert error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })

      if (error.code === "23505") {
        if (error.message.includes("email")) {
          return {
            success: false,
            error: "An account with this email already exists.",
          }
        } else if (error.message.includes("id")) {
          return {
            success: false,
            error: "Database configuration error. Please contact support.",
          }
        }
      }
      return {
        success: false,
        error: "Registration failed. Please try again.",
      }
    }

    console.log("[v0] Teacher signup successful:", data)
    return {
      success: true,
      message: "Registered successfully! Welcome to Hobease teaching community.",
    }
  } catch (error) {
    console.error("Teacher signup error:", error)
    return {
      success: false,
      error: "An error occurred. Please try again.",
    }
  }
}
