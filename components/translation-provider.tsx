"use client"
import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
import LanguageSelector from "@/components/language-selector"
import { translateText, type Language } from "@/lib/translations"

interface TranslationContextType {
  currentLanguage: Language
  setLanguage: (language: Language) => void
  translate: (text: string) => Promise<string>
  isTranslating: boolean
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: React.ReactNode }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>("en")
  const [isTranslating, setIsTranslating] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|; )hobease-language=([^;]+)/)?.[1] as Language | undefined
    if (saved && ["en", "hi", "es", "de", "fr"].includes(saved)) setCurrentLanguage(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = currentLanguage
    document.cookie = `hobease-language=${currentLanguage}; path=/; max-age=31536000; samesite=lax`
  }, [currentLanguage])

  const translate = useCallback(
    async (text: string): Promise<string> => {
      setIsTranslating(true)
      try {
        const result = await translateText(text, currentLanguage)
        return result
      } finally {
        setIsTranslating(false)
      }
    },
    [currentLanguage],
  )

  const setLanguage = useCallback((language: Language) => {
    document.cookie = `hobease-language=${language}; path=/; max-age=31536000; samesite=lax`
    setCurrentLanguage(language)
  }, [])

  return (
    <TranslationContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        translate,
        isTranslating,
      }}
    >
      {children}
      {pathname !== "/" && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md bg-background/95 shadow-sm backdrop-blur" translate="no">
          <LanguageSelector currentLanguage={currentLanguage} onLanguageChange={setLanguage} />
        </div>
      )}
    </TranslationContext.Provider>
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (context === undefined) {
    throw new Error("useTranslation must be used within a TranslationProvider")
  }
  return context
}
