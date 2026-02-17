"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, GraduationCap, BookOpen } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { User as SupabaseUser } from "@supabase/supabase-js"
import AuthModal from "./auth-modal"
import Link from "next/link"

export default function ProfileSection() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isTeacher, setIsTeacher] = useState(false)
  const [teacherLoading, setTeacherLoading] = useState(false)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const checkTeacherStatus = async () => {
      if (!user?.email) {
        setIsTeacher(false)
        return
      }

      const cacheKey = `teacher_${user.email}`
      const cached = sessionStorage.getItem(cacheKey)
      
      if (cached !== null) {
        setIsTeacher(cached === 'true')
        setTeacherLoading(false)
        return
      }

      setTeacherLoading(true)

      try {
        const { data, error } = await supabase.from("Teachers").select("id").eq("email", user.email).limit(1).maybeSingle()

        const isTeacher = !error && !!data
        sessionStorage.setItem(cacheKey, String(isTeacher))
        setIsTeacher(isTeacher)
      } catch (error) {
        sessionStorage.setItem(cacheKey, 'false')
        setIsTeacher(false)
      } finally {
        setTeacherLoading(false)
      }
    }

    if (user) {
      checkTeacherStatus()
    } else {
      setIsTeacher(false)
    }
  }, [user])

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
  }

  if (!user) {
    return (
      <>
        <Button
          onClick={() => setShowAuthModal(true)}
          className="bg-[#FF6600] hover:bg-[#FF6600]/90 text-white px-6 py-2 rounded-xl font-sans shadow-md hover:shadow-lg transition-all duration-200"
        >
          Sign In
        </Button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    )
  }

  // Logged in - show profile dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 font-sans bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white hover:shadow-md transition-all duration-200 rounded-xl"
        >
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">Profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-white/95 backdrop-blur-xl border-gray-200 shadow-xl rounded-2xl"
      >
        <div className="px-3 py-2">
          <p className="text-sm font-medium text-gray-900">
            {user.user_metadata?.name || user.email?.split("@")[0] || "User"}
          </p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="/learner/dashboard"
            className="flex items-center cursor-pointer hover:bg-[#00B9D9]/10 rounded-xl mx-1"
          >
            <BookOpen className="h-4 w-4 mr-2 text-[#00B9D9]" />
            <span className="text-[#00B9D9]">Learner Dashboard</span>
          </Link>
        </DropdownMenuItem>
        {isTeacher && !teacherLoading && (
          <>
            <DropdownMenuItem asChild>
              <Link
                href="/teacher/dashboard"
                className="flex items-center cursor-pointer hover:bg-blue-50 rounded-xl mx-1"
              >
                <GraduationCap className="h-4 w-4 mr-2 text-blue-600" />
                <span className="text-blue-600">Teacher Dashboard</span>
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          className="text-red-600 cursor-pointer hover:bg-red-50 rounded-xl mx-1"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
