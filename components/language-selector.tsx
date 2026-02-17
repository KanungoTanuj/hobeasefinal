"use client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Globe } from "lucide-react"
import { languageNames, type Language } from "@/lib/translations"
import { useState, useEffect } from "react"

interface LanguageSelectorProps {
  currentLanguage: Language
  onLanguageChange: (language: Language) => void
}

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
  const [languageText, setLanguageText] = useState("Language")

  useEffect(() => {
    const translateLanguageText = async () => {
      if (currentLanguage === "en") {
        setLanguageText("Language")
      } else {
        try {
          const response = await fetch(
            `https://api.mymemory.translated.net/get?q=${encodeURIComponent("Language")}&langpair=en|${currentLanguage}`,
          )
          const data = await response.json()
          setLanguageText(data.responseData?.translatedText || "Language")
        } catch (error) {
          console.error("Translation error:", error)
          setLanguageText("Language")
        }
      }
    }

    translateLanguageText()
  }, [currentLanguage])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="text-gray-700 hover:text-[#FF6600] transition-colors font-sans">
          <Globe className="h-4 w-4 mr-2" />
          {languageText}
          <ChevronDown className="h-4 w-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {Object.entries(languageNames).map(([code, name]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => onLanguageChange(code as Language)}
            className={`cursor-pointer ${currentLanguage === code ? "bg-[#FF6600]/10 text-[#FF6600]" : ""}`}
          >
            {name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
