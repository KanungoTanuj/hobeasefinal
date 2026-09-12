"use client"
import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
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
  const translatedNodes = useRef(new Map<Text, string>())
  const translatingPage = useRef(false)

  useEffect(() => {
    const saved = document.cookie.match(/(?:^|; )hobease-language=([^;]+)/)?.[1] as Language | undefined
    if (saved && ["en", "hi", "es", "de", "fr"].includes(saved)) setCurrentLanguage(saved)
  }, [])

  useEffect(() => {
    document.documentElement.lang = currentLanguage
    document.cookie = `hobease-language=${currentLanguage}; path=/; max-age=31536000; samesite=lax`
    if (currentLanguage === "en") {
      translatedNodes.current.forEach((original, node) => { node.textContent = original })
      translatedNodes.current.clear()
      return
    }

    let cancelled = false
    const translatePage = async () => {
      if (translatingPage.current) return
      translatingPage.current = true
      const root = document.body
      const nodes: Text[] = []
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        const parent = node.parentElement
        const text = node.textContent?.trim()
        if (!parent || !text || text.length < 2 || ["SCRIPT", "STYLE", "NOSCRIPT", "INPUT", "TEXTAREA"].includes(parent.tagName)) continue
        if (!translatedNodes.current.has(node)) translatedNodes.current.set(node, node.textContent || "")
        nodes.push(node as Text)
      }
      setIsTranslating(true)
      await Promise.all(nodes.slice(0, 120).map(async (textNode) => {
        const original = translatedNodes.current.get(textNode) || textNode.textContent || ""
        const translated = await translateText(original.trim(), currentLanguage)
        if (!cancelled && translated && textNode.isConnected) textNode.textContent = original.replace(original.trim(), translated)
      }))
      translatingPage.current = false
      if (!cancelled) setIsTranslating(false)
    }
    void translatePage()
    const observer = new MutationObserver(() => void translatePage())
    observer.observe(document.body, { childList: true, subtree: true })
    return () => { cancelled = true; observer.disconnect() }
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
