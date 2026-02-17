"use client"

import type React from "react"

import { useState, useMemo, useEffect, useRef } from "react" // add useRef for deduping logs
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Star, Filter, MapPin, Loader2, Heart, Award, X } from "lucide-react"
import BookingModal from "@/components/booking-modal"
import ProfileSection from "@/components/profile-section"
import { supabase } from "@/lib/supabase"
import Fuse from "fuse.js"

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

const categories = [
  "All Categories",
  "Technology",
  "Creative",
  "Business",
  "Language",
  "Music",
  "Fitness",
  "Academic",
  "Lifestyle",
]
const priceRanges = ["All Prices", "Under ₹500", "₹500-₹1000", "₹1000-₹2000", "Over ₹2000"]

export default function MarketplacePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("") // Used for actual filtering
  const [inputValue, setInputValue] = useState("") // Added separate state for input field
  const [selectedCategory, setSelectedCategory] = useState("All Categories")
  const [selectedPriceRange, setSelectedPriceRange] = useState("All Prices")
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false)
  const [selectedSkill, setSelectedSkill] = useState<SkillCard | null>(null)
  const [skills, setSkills] = useState<SkillCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [user, setUser] = useState<any>(null)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false) // add isSearching state to prevent double submits and show stable UX while logging

  const lastLoggedQueryRef = useRef<string | null>(null) // track last logged query to avoid duplicate inserts

  const fetchSkills = async () => {
    try {
      // Check cache first
      const cachedSkills = sessionStorage.getItem('marketplace_skills')
      const cacheTime = sessionStorage.getItem('marketplace_skills_time')
      const now = Date.now()
      
      if (cachedSkills && cacheTime && now - parseInt(cacheTime) < 5 * 60 * 1000) {
        setSkills(JSON.parse(cachedSkills))
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: supabaseError } = await supabase.from("teacher_skills_view").select("*")

      if (supabaseError) {
        throw supabaseError
      }

      // Transform database data to UI format
      const transformedSkills: SkillCard[] = (data as DatabaseSkill[]).map((dbSkill) => ({
        skillId: dbSkill.skill_id,
        teacherId: dbSkill.teacher_id,
        teacherName: dbSkill.teacher_name,
        teacherEmail: dbSkill.teacher_email,
        teacherPhoto: dbSkill.teacher_photo || "/professional-teacher.png",
        teacherBio: dbSkill.teacher_bio,
        teacherRating: dbSkill.teacher_rating || 4.5,
        teacherExperience: dbSkill.teacher_experience,
        skillName: dbSkill.skill_name,
        skillCategory: dbSkill.skill_category,
        proficiencyLevel: dbSkill.proficiency_level,
        skillYearsExperience: dbSkill.skill_years_experience,
        pricePerHour: dbSkill.price_per_hour,
        skillDescription: dbSkill.skill_description,
        isPrimary: dbSkill.is_primary,
        location: "India",
        reviews: Math.floor(Math.random() * 200) + 10,
      }))

      setSkills(transformedSkills)
      // Cache for 5 minutes
      sessionStorage.setItem('marketplace_skills', JSON.stringify(transformedSkills))
      sessionStorage.setItem('marketplace_skills_time', String(now))
    } catch (err) {
      setError("Failed to load skills. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getCurrentUser = async () => {
    try {
      setAuthLoading(true)

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        setUser(null)
        return
      }

      if (session?.user) {
        setUser(session.user)
        await fetchWishlist(session.user.id)
      } else {
        setUser(null)
      }
    } catch (err) {
      setUser(null)
    } finally {
      setAuthLoading(false)
    }
  }

  const fetchWishlist = async (userAuthId: string) => {
    try {
      const { data, error } = await supabase.from("learners").select("wishlist").eq("auth_id", userAuthId).single()

      if (data && data.wishlist) {
        const wishlistArray = JSON.parse(data.wishlist)
        setWishlist(new Set(wishlistArray))
      }
    } catch (err) {
      console.error("[v0] Error fetching wishlist:", err)
    }
  }

  const toggleWishlist = async (skillId: string) => {
    if (!user) {
      alert("Please sign in to add skills to your wishlist")
      return
    }

    const newWishlist = new Set(wishlist)
    if (newWishlist.has(skillId)) {
      newWishlist.delete(skillId)
    } else {
      newWishlist.add(skillId)
    }

    setWishlist(newWishlist)

    // Update in database
    try {
      const wishlistArray = Array.from(newWishlist)

      const { data: existingLearner, error: fetchError } = await supabase
        .from("learners")
        .select("id")
        .eq("auth_id", user.id)
        .single()

      let error
      if (existingLearner) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("learners")
          .update({
            wishlist: JSON.stringify(wishlistArray),
          })
          .eq("id", existingLearner.id)
        error = updateError
      } else {
        const { error: insertError } = await supabase.from("learners").insert({
          auth_id: user.id,
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
          wishlist: JSON.stringify(wishlistArray),
        })
        error = insertError
      }

      if (error) {
        console.error("[v0] Error updating wishlist:", error)
        // Revert on error
        setWishlist(wishlist)
      }
    } catch (err) {
      console.error("[v0] Error updating wishlist:", err)
      setWishlist(wishlist)
    }
  }

  const handleBookNow = (skill: SkillCard) => {
    setSelectedSkill(skill)
    setIsBookingModalOpen(true)
  }

  const ensureLearnerId = async (userAuthId: string, fallbackEmail?: string | null, fallbackName?: string | null) => {
    try {
      const { data: existing, error: fetchErr } = await supabase
        .from("learners")
        .select("id")
        .eq("auth_id", userAuthId)
        .limit(1)
        .maybeSingle()

      if (fetchErr) {
        console.log("[v0] ensureLearnerId fetchErr:", fetchErr?.message)
      }

      if (existing?.id) return existing.id

      // create minimal learner row (RLS requires auth.uid() == learners.auth_id)
      const insertPayload = {
        auth_id: userAuthId,
        email: fallbackEmail ?? null,
        name: fallbackName ?? fallbackEmail ?? "Learner",
      }

      const { data: inserted, error: insertErr } = await supabase
        .from("learners")
        .insert(insertPayload)
        .select("id")
        .single()

      if (insertErr) {
        console.error("[v0] ensureLearnerId insertErr:", insertErr.message)
        return null
      }

      return inserted.id
    } catch (e: any) {
      console.error("[v0] ensureLearnerId unexpected error:", e?.message || e)
      return null
    }
  }

  const logSearchHistory = async (query: string) => {
    try {
      const q = query.trim()
      if (!q || q.length < 2) return

      // de-dupe identical consecutive submissions in this session
      if (lastLoggedQueryRef.current === q) return

      // must have an authenticated user for RLS to pass
      const {
        data: { session },
      } = await supabase.auth.getSession()

      const authUser = session?.user
      if (!authUser) {
        console.log("[v0] skip logSearchHistory (not signed in)")
        return
      }

      const learnerId = await ensureLearnerId(authUser.id, authUser.email, authUser.user_metadata?.full_name)
      if (!learnerId) {
        console.log("[v0] skip logSearchHistory (no learner id)")
        return
      }

      const { error: insertErr } = await supabase.from("search_history").insert([{ learner_id: learnerId, query: q }])

      if (insertErr) {
        console.error("[v0] search_history insert error:", insertErr.message)
      } else {
        lastLoggedQueryRef.current = q
      }

      // optional counter (only if function exists). Note: function arg is p_learner_id
      const { error: rpcErr } = await supabase.rpc("increment_total_searches", { p_learner_id: learnerId })
      if (rpcErr) {
        // not fatal if function not present
        console.log("[v0] increment_total_searches RPC info:", rpcErr.message)
      }
    } catch (e: any) {
      console.error("[v0] logSearchHistory unexpected error:", e?.message || e)
    }
  }

  useEffect(() => {
    fetchSkills()
    getCurrentUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        await fetchWishlist(session.user.id)
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setWishlist(new Set())
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isInitialized) {
      const searchQuery = searchParams.get("search")
      const skillQuery = searchParams.get("skill")

      if (searchQuery) {
        setSearchTerm(searchQuery)
        setInputValue(searchQuery)
      } else if (skillQuery) {
        setSearchTerm(skillQuery)
        setInputValue(skillQuery)
      }

      setIsInitialized(true)
    }
  }, [searchParams, isInitialized])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
  }

  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const value = inputValue.trim()

    // update filter term immediately so UI reflects the query
    setSearchTerm(value)

    if (!value) {
      router.push("/marketplace")
      return
    }

    try {
      setIsSearching(true)
      await logSearchHistory(value) // ensure insert completes before navigation
      const newUrl = `/marketplace?search=${encodeURIComponent(value)}`
      router.push(newUrl)
    } catch (err) {
      console.error("[v0] handleSearchSubmit error:", (err as any)?.message || err)
    } finally {
      setIsSearching(false)
    }
  }

  const { filteredSkills, suggestions } = useMemo(() => {
    // Create search index for fuzzy matching
    const fuseOptions = {
      keys: [
        { name: "teacherName", weight: 0.3 },
        { name: "skillName", weight: 0.4 },
        { name: "skillCategory", weight: 0.2 },
        { name: "skillDescription", weight: 0.1 },
      ],
      threshold: 0.4, // Lower = more strict, Higher = more fuzzy
      includeScore: true,
      minMatchCharLength: 2,
    }

    const fuse = new Fuse(skills, fuseOptions)

    let matchedSkills = skills
    let searchSuggestions: string[] = []

    if (searchTerm.trim()) {
      // Try fuzzy search first
      const fuseResults = fuse.search(searchTerm)

      if (fuseResults.length > 0) {
        // Use fuzzy search results
        matchedSkills = fuseResults.map((result) => result.item)
      } else {
        // No fuzzy matches found, generate suggestions
        const allSearchableTerms = [
          ...new Set([
            ...skills.map((s) => s.skillName),
            ...skills.map((s) => s.skillCategory),
            ...skills.map((s) => s.teacherName),
          ]),
        ]

        // Create suggestions using fuzzy matching on terms
        const suggestionFuse = new Fuse(allSearchableTerms, {
          threshold: 0.6,
          includeScore: true,
        })

        const suggestionResults = suggestionFuse.search(searchTerm)
        searchSuggestions = suggestionResults.slice(0, 3).map((result) => result.item)

        matchedSkills = [] // No matches for original search
      }
    }

    // Apply category and price filters
    const filtered = matchedSkills.filter((skill) => {
      const matchesCategory = selectedCategory === "All Categories" || skill.skillCategory === selectedCategory

      const matchesPrice = (() => {
        switch (selectedPriceRange) {
          case "Under ₹500":
            return skill.pricePerHour < 500
          case "₹500-₹1000":
            return skill.pricePerHour >= 500 && skill.pricePerHour <= 1000
          case "₹1000-₹2000":
            return skill.pricePerHour >= 1000 && skill.pricePerHour <= 2000
          case "Over ₹2000":
            return skill.pricePerHour > 2000
          default:
            return true
        }
      })()

      return matchesCategory && matchesPrice
    })

    return { filteredSkills: filtered, suggestions: searchSuggestions }
  }, [searchTerm, selectedCategory, selectedPriceRange, skills])

  const handleSuggestionClick = (suggestion: string) => {
    setSearchTerm(suggestion)
    setInputValue(suggestion)
    setShowSuggestions(false)

    const newUrl = `/marketplace?search=${encodeURIComponent(suggestion)}`
    router.push(newUrl)
    void logSearchHistory(suggestion)
  }

  const clearSearch = () => {
    setSearchTerm("")
    setInputValue("")
    setSelectedCategory("All Categories")
    setSelectedPriceRange("All Prices")
    setShowSuggestions(false)

    router.push("/marketplace")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="hover:opacity-80 transition-opacity cursor-pointer">
                <h1 className="text-2xl font-bold font-serif">
                  <span className="text-[#FF6600]">Hob</span>
                  <span className="text-[#00B9D9]">ease</span>
                </h1>
              </Link>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-primary font-medium">
                Browse Skills
              </a>
              <a href="#" className="text-foreground hover:text-primary transition-colors">
                How it Works
              </a>
              <ProfileSection />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-[#FF6600] to-[#00B9D9]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 font-serif">Find Your Perfect Skill</h1>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Browse expert skills from passionate teachers and find the perfect match for your learning goals.
            </p>
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-muted/30 border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <form
                className="flex-1 relative"
                onSubmit={handleSearchSubmit}
                role="search"
                aria-label="Marketplace search"
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search skills, teachers, or categories..."
                  value={inputValue}
                  onChange={handleInputChange}
                  disabled={isSearching}
                  className="pl-10 pr-10 h-12 border-2 border-gray-200 focus:border-[#FF6600] focus:ring-[#FF6600]/20"
                />
                {inputValue && (
                  <Button
                    size="sm"
                    variant="ghost"
                    type="button"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
                    onClick={clearSearch}
                    disabled={isSearching}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                )}
                <button type="submit" className="sr-only">
                  Search
                </button>
              </form>

              {/* Category Filter */}
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full md:w-48 h-12 border-2 border-gray-200 focus:border-[#FF6600]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Filter */}
              <Select value={selectedPriceRange} onValueChange={setSelectedPriceRange}>
                <SelectTrigger className="w-full md:w-48 h-12 border-2 border-gray-200 focus:border-[#FF6600]">
                  <SelectValue placeholder="Select Price Range" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges.map((range) => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isSearching && <div className="mt-2 text-sm text-muted-foreground">Logging your search…</div>}

            {inputValue && suggestions.length > 0 && filteredSkills.length === 0 && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Did you mean:</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="text-blue-700 border-blue-300 hover:bg-blue-100 bg-transparent"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Results Count */}
            <div className="mt-4 text-sm text-muted-foreground">
              {loading ? (
                "Loading skills..."
              ) : error ? (
                <span className="text-red-500">{error}</span>
              ) : (
                <>
                  Showing {filteredSkills.length} skill{filteredSkills.length !== 1 ? "s" : ""}
                  {searchTerm && <span> for "{searchTerm}"</span>}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Skills Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#FF6600]" />
              <span className="ml-2 text-muted-foreground">Loading skills...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchSkills} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {filteredSkills.map((skill) => (
                <Card
                  key={skill.skillId}
                  className="group hover:shadow-lg transition-all duration-300 border-border/50 overflow-hidden"
                >
                  {/* Teacher Photo */}
                  <div className="aspect-square overflow-hidden relative">
                    <img
                      src={skill.teacherPhoto || "/placeholder.svg?height=300&width=300&query=professional teacher"}
                      alt={skill.teacherName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Wishlist Button Overlay */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 backdrop-blur-sm"
                      onClick={() => toggleWishlist(skill.skillId)}
                    >
                      <Heart
                        className={`h-4 w-4 ${
                          wishlist.has(skill.skillId) ? "fill-red-500 text-red-500" : "text-gray-600"
                        }`}
                      />
                    </Button>
                    {/* Primary Skill Badge */}
                    {skill.isPrimary && (
                      <Badge className="absolute top-2 left-2 bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                        Primary
                      </Badge>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {skill.skillCategory}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        {skill.teacherRating}
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-[#FF6600] transition-colors">
                      {skill.skillName}
                    </CardTitle>
                    <p className="text-sm font-medium text-[#00B9D9]">by {skill.teacherName}</p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Location and Experience */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        {skill.location}
                      </div>

                      {/* Proficiency and Experience */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span className="capitalize">{skill.proficiencyLevel}</span>
                        </div>
                        <span className="text-muted-foreground">{skill.skillYearsExperience} yrs exp</span>
                      </div>

                      {/* Skill Description */}
                      {skill.skillDescription && (
                        <p className="text-sm text-muted-foreground line-clamp-2">{skill.skillDescription}</p>
                      )}

                      {/* Reviews */}
                      <p className="text-sm text-muted-foreground">
                        {skill.reviews} reviews • {skill.teacherExperience}
                      </p>

                      {/* Price and CTA */}
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <span className="text-2xl font-bold text-[#FF6600]">₹{skill.pricePerHour}</span>
                          <span className="text-sm text-muted-foreground">/hour</span>
                        </div>
                        <Link href={`/teachers/${skill.teacherId}?skillId=${skill.skillId}`}>
                          <Button size="sm" className="bg-[#FF6600] hover:bg-[#FF6600]/90 text-white">
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && filteredSkills.length === 0 && (
            <div className="text-center py-12">
              <div className="max-w-md mx-auto">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No skills found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search terms or filters to find more skills.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log("[v0] Clear filters button clicked")
                    clearSearch()
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Booking Modal */}
      <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} skill={selectedSkill} />
    </div>
  )
}
