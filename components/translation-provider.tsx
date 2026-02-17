"use client"
import type React from "react"
import { createContext, useContext, useState, useCallback } from "react"
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
